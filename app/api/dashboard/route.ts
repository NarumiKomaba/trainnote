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
    stampType: stampsMap.get(dateKey) ?? "none",
  }));

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

  logsSnap.docs.forEach((doc) => {
    const log = doc.data() as { dateKey: string; items?: any[] };
    const dateKey = log.dateKey;
    (log.items ?? []).forEach((item) => {
      if (!item?.equipmentId || item.weight === null || item.weight === undefined) return;
      const name = equipmentMap.get(item.equipmentId) ?? item.equipmentId;
      if (!equipmentSeries[name]) equipmentSeries[name] = [];
      equipmentSeries[name].push({ dateKey, value: Number(item.weight) });
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
    habitSeries,
    equipmentSeries,
  });
}
