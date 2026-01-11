import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import type { TrainingPattern } from "@/lib/types";

const ReqSchema = z.object({
  uid: z.string().min(1),
  name: z.string().min(1).max(60),
  type: z.enum(["training", "stretch", "recovery", "custom"]),
  description: z.string().max(2000).optional(),
  allowedEquipmentIds: z.array(z.string()).max(300),
  tags: z.array(z.string()).max(30).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uid, name, type, description, allowedEquipmentIds, tags } = parsed.data;

  const now = Date.now();
  const ref = adminDb.collection(`users/${uid}/patterns`).doc();

  const pattern: TrainingPattern = {
    id: ref.id,
    name,
    type,
    description: description ?? "",
    allowedEquipmentIds,
    tags: tags ?? [],
    createdAt: now,
  };

  await ref.set(pattern);
  return NextResponse.json({ ok: true, patternId: ref.id });
}
