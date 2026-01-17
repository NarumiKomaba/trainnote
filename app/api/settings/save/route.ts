import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import type { UserSettings } from "@/lib/types";

const WeeklyRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  patternId: z.string().nullable(),
});

const ReqSchema = z.object({
  uid: z.string().min(1),
  weeklyRules: z.array(WeeklyRuleSchema).length(7),
  preference: z.enum(["easy", "normal", "hard"]),
  goalText: z.string().optional(),
  availableTimeMin: z.number().int().min(1).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { uid, weeklyRules, preference, goalText, availableTimeMin } = parsed.data;

  // dayOfWeek重複排除・正規化（念のため）
  const normalized = Array.from({ length: 7 }).map((_, i) => {
    const found = weeklyRules.find((r) => r.dayOfWeek === i);
    return { dayOfWeek: i, patternId: found?.patternId ?? null };
  });

  const settings: UserSettings = {
    uid,
    weeklyRules: normalized,
    preference,
    goalText: goalText ?? "",
    availableTimeMin,
    updatedAt: Date.now(),
  };

  await adminDb.doc(`users/${uid}/settings/main`).set(settings, { merge: true });

  return NextResponse.json({ ok: true });
}
