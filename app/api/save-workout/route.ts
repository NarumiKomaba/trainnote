import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import type { WorkoutLog, Stamp } from "@/lib/types";

const ItemSchema = z.object({
  name: z.string(),
  equipmentId: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
  sets: z.number().nullable().optional(),
  durationMin: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  done: z.boolean(),
});

const ReqSchema = z.object({
  uid: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  patternId: z.string().min(1),
  items: z.array(ItemSchema),
  completed: z.boolean(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uid, dateKey, patternId, items, completed } = parsed.data;

  const now = Date.now();

  const log: WorkoutLog = {
    dateKey,
    patternId,
    items,
    completed,
    createdAt: now,
    updatedAt: now,
  };

  await adminDb.doc(`users/${uid}/workoutLogs/${dateKey}`).set(log, { merge: true });

  const doneCount = items.filter((i) => i.done).length;
  const stampType: Stamp["stampType"] =
    doneCount === 0 ? "skipped" : doneCount === items.length ? "done" : "partial";

  const stamp: Stamp = { dateKey, stampType, updatedAt: now };
  await adminDb.doc(`users/${uid}/stamps/${dateKey}`).set(stamp, { merge: true });

  return NextResponse.json({ ok: true, stampType });
}
