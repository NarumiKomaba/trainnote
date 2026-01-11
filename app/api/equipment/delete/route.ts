import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";

const ReqSchema = z.object({
  uid: z.string().min(1),
  equipmentId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { uid, equipmentId } = parsed.data;

  await adminDb.doc(`users/${uid}/equipment/${equipmentId}`).delete();
  return NextResponse.json({ ok: true });
}
