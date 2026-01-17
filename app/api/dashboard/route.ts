import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";

const ReqSchema = z.object({
  uid: z.string().min(1),
});

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { uid } = parsed.data;
  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return toDateKey(date);
  });

  const stampsSnap = await adminDb
    .collection(`users/${uid}/stamps`)
    .where("dateKey", ">=", last7Days[0])
    .where("dateKey", "<=", last7Days[last7Days.length - 1])
    .get();

  const stampsMap = new Map<string, string>();
  stampsSnap.docs.forEach((doc) => {
    const data = doc.data();
    stampsMap.set(data.dateKey, data.stampType);
  });

  const habitSeries = last7Days.map((dateKey) => ({
    dateKey,
    stampType: (stampsMap.get(dateKey) as "done" | "partial" | "skipped" | "none") ?? "none",
  }));

  // --- Statistics Calculation ---
  // 1. Weekly Completion Rate (based on last 7 days stamps)
  const doneCount = habitSeries.filter(h => h.stampType === "done").length;
  const completionRate = Math.round((doneCount / 7) * 100) || 0;

  // 2. Continuous Streak (Total consecutive days with done/partial records)
  // Get more stamps to calculate streak correctly if needed, but for now we look at recent.
  // To be accurate, we should fetch more or at least check recent records.
  const allStampsSnap = await adminDb
    .collection(`users/${uid}/stamps`)
    .orderBy("dateKey", "desc")
    .limit(100)
    .get();

  let streak = 0;
  const allStamps = allStampsSnap.docs.map(d => d.data());
  const todayKey = toDateKey(new Date());

  // Check if there's a record for today or yesterday to start the streak
  const hasToday = allStamps.some(s => s.dateKey === todayKey && (s.stampType === "done" || s.stampType === "partial"));
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);
  const hasYesterday = allStamps.some(s => s.dateKey === yesterdayKey && (s.stampType === "done" || s.stampType === "partial"));

  if (hasToday || hasYesterday) {
    let current = hasToday ? new Date() : yesterday;
    while (true) {
      const key = toDateKey(current);
      const found = allStamps.find(s => s.dateKey === key && (s.stampType === "done" || s.stampType === "partial"));
      if (!found) break;
      streak++;
      current.setDate(current.getDate() - 1);
    }
  }

  const equipmentSnap = await adminDb.collection(`users/${uid}/equipment`).get();
  const equipmentMap = new Map<string, string>();
  equipmentSnap.docs.forEach((doc) => {
    const data = doc.data();
    equipmentMap.set(doc.id, data.name ?? doc.id);
  });

  const logsSnap = await adminDb
    .collection(`users/${uid}/workoutLogs`)
    .orderBy("dateKey", "desc")
    .limit(60)
    .get();

  const equipmentSeries: Record<string, { dateKey: string; value: number }[]> = {};
  let maxWeight = 0;

  logsSnap.docs.forEach((doc) => {
    const log = doc.data() as { dateKey: string; items?: any[] };
    const dateKey = log.dateKey;
    (log.items ?? []).forEach((item) => {
      if (!item?.equipmentId || item.weight === null || item.weight === undefined) return;
      const weightNum = Number(item.weight);
      if (weightNum > maxWeight) maxWeight = weightNum;

      const name = equipmentMap.get(item.equipmentId) ?? item.equipmentId;
      if (!equipmentSeries[name]) equipmentSeries[name] = [];
      equipmentSeries[name].push({ dateKey, value: weightNum });
    });
  });

  Object.keys(equipmentSeries).forEach((key) => {
    const byDate = new Map<string, number>();
    equipmentSeries[key].forEach((entry) => {
      const current = byDate.get(entry.dateKey) ?? 0;
      byDate.set(entry.dateKey, Math.max(current, entry.value));
    });
    equipmentSeries[key] = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateKey, value]) => ({ dateKey, value }));
  });

  return NextResponse.json({
    summary: {
      completionRate: `${completionRate}%`,
      streak: `${streak}日`,
      maxWeight: `${maxWeight}kg`,
    },
    habitSeries,
    equipmentSeries,
  });
}
