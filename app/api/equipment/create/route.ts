import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import type { Equipment } from "@/lib/types";

const ReqSchema = z.object({
  uid: z.string().min(1),
  name: z.string().min(1).max(60),
  unit: z.enum(["kg", "reps", "min", "sec", "level", "none"]),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { uid, name, unit, note } = parsed.data;

  const now = Date.now();
  const ref = adminDb.collection(`users/${uid}/equipment`).doc();

  const equipment: Equipment = {
    id: ref.id,
    name: name.trim(),
    unit,
    note: (note ?? "").trim(),
    createdAt: now,
  };

  await ref.set(equipment);
  return NextResponse.json({ ok: true, equipmentId: ref.id });
}
