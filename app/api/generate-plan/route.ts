import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { geminiGenerateJSON } from "@/lib/gemini";
import type { DailyPlan, TrainingPattern, Equipment, UserSettings } from "@/lib/types";

const ReqSchema = z.object({
  uid: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function dayOfWeekFromDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getDay(); // 0-6
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uid, dateKey } = parsed.data;

  // 既に作ってあればそれを返す（無駄生成防止）
  const planRef = adminDb.doc(`users/${uid}/dailyPlans/${dateKey}`);
  const existing = await planRef.get();
  if (existing.exists) {
    return NextResponse.json(existing.data());
  }

  // settings
  const settingsSnap = await adminDb.doc(`users/${uid}/settings/main`).get();
  const settings = (settingsSnap.data() as UserSettings | undefined) ?? null;

  const dow = dayOfWeekFromDateKey(dateKey);
  const rule = settings?.weeklyRules?.find((r) => r.dayOfWeek === dow) ?? null;
  const patternId = rule?.patternId ?? null;

  if (!patternId) {
    // 休み扱い：空プランでも良い（後でUIで「休養日」表示）
    const restPlan: DailyPlan = {
      dateKey,
      patternId: "rest",
      theme: "休養日",
      items: [],
      createdAt: Date.now(),
      modelInfo: { provider: "gemini", model: "gemini-2.5-flash" },
    };
    await planRef.set(restPlan);
    return NextResponse.json(restPlan);
  }

  const patternSnap = await adminDb.doc(`users/${uid}/patterns/${patternId}`).get();
  if (!patternSnap.exists) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }
  const pattern = patternSnap.data() as TrainingPattern;

  // equipments (allowedEquipmentIdsが空なら全機材でもOK。ここでは allowed があればそれのみ)
  const equipCol = adminDb.collection(`users/${uid}/equipment`);
  let equipments: Equipment[] = [];
  if (pattern.allowedEquipmentIds?.length) {
    const refs = pattern.allowedEquipmentIds.map((id) => equipCol.doc(id));
    const snaps = await adminDb.getAll(...refs);
    equipments = snaps.filter(s => s.exists).map(s => ({ id: s.id, ...(s.data() as any) }));
  } else {
    const all = await equipCol.limit(200).get();
    equipments = all.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  // recent logs (直近30日)
  const logsSnap = await adminDb
    .collection(`users/${uid}/workoutLogs`)
    .orderBy("dateKey", "desc")
    .limit(30)
    .get();
  const recentLogs = logsSnap.docs.map((d) => d.data());

  const preference = settings?.preference ?? "normal";
  const goalText = settings?.goalText ?? "";

  // --- Gemini Prompt ---
  const prompt = `
You are a personal training planner.
Return ONLY JSON that matches the schema exactly.

# Today
dateKey: "${dateKey}"

# Pattern
pattern = ${JSON.stringify(
    {
      id: pattern.id,
      name: pattern.name,
      type: pattern.type,
      description: pattern.description ?? "",
      tags: pattern.tags ?? [],
    },
    null,
    2
  )}

# Allowed equipment list (use only these if possible)
equipment = ${JSON.stringify(
    equipments.map((e) => ({
      id: e.id,
      name: e.name,
      unit: e.unit,
      note: e.note ?? "",
    })),
    null,
    2
  )}

# User preference
preference: "${preference}"  // easy|normal|hard

# Goal (free text)
goalText: ${JSON.stringify(goalText)}

# Recent workout logs (latest first)
recentLogs: ${JSON.stringify(recentLogs, null, 2)}

# Requirements
- Propose a practical plan for TODAY based on pattern and recent logs.
- Keep it short (5-8 items max).
- For stretch/recovery patterns, use durationMin instead of weight.
- Use equipmentId when it clearly matches an equipment item; otherwise set null.
- Provide a brief reason per item.
- Avoid unsafe advice. If user seems overtrained (many skips / high difficulty), lower intensity.

# Output JSON Schema
{
  "dateKey": "YYYY-MM-DD",
  "patternId": "${patternId}",
  "theme": "string",
  "items": [
    {
      "name": "string",
      "equipmentId": "string|null",
      "weight": "number|null",
      "reps": "number|null",
      "sets": "number|null",
      "durationMin": "number|null",
      "note": "string|null",
      "reason": "string|null"
    }
  ]
}
`.trim();

  console.info("[generate-plan] prompt", {
    uid,
    dateKey,
    patternId,
    equipmentCount: equipments.length,
    prompt,
  });

  const gemini = await geminiGenerateJSON(prompt);
  console.info("[generate-plan] gemini response", {
    uid,
    dateKey,
    patternId,
    response: gemini,
  });

  // gemini response parsing（responseMimeType=jsonでも、形式揺れがあり得るので念のため）
  const text =
    gemini?.candidates?.[0]?.content?.parts?.[0]?.text ??
    JSON.stringify(gemini);

  let planObj: any;
  try {
    planObj = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Gemini returned non-JSON", raw: text },
      { status: 502 }
    );
  }

  // 最低限の整形
  const allowedIds = new Set(
    pattern.allowedEquipmentIds?.length ? pattern.allowedEquipmentIds : equipments.map((e) => e.id)
  );
  const allowedNameMap = new Map(
    equipments.map((e) => [e.name.toLowerCase(), e.id])
  );

  const normalizedItems = Array.isArray(planObj.items)
    ? planObj.items.map((item: any) => {
        const name = String(item.name ?? "");
        let equipmentId = item.equipmentId ?? null;

        if (equipmentId && !allowedIds.has(equipmentId)) {
          equipmentId = null;
        }

        if (!equipmentId && name) {
          for (const [equipName, equipId] of allowedNameMap.entries()) {
            if (name.toLowerCase().includes(equipName)) {
              equipmentId = equipId;
              break;
            }
          }
        }

        if (equipmentId && !allowedIds.has(equipmentId)) {
          equipmentId = null;
        }

        return { ...item, equipmentId };
      })
    : [];
  const plan: DailyPlan = {
    dateKey,
    patternId,
    theme: String(planObj.theme ?? pattern.name),
    items: normalizedItems,
    createdAt: Date.now(),
    modelInfo: { provider: "gemini", model: "gemini-2.5-flash" },
  };

  await planRef.set(plan);
  return NextResponse.json(plan);
}
