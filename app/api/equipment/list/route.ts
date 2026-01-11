import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import type { Equipment } from "@/lib/types";

const ReqSchema = z.object({
  uid: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uid } = parsed.data;

  const snap = await adminDb
    .collection(`users/${uid}/equipment`)
    .orderBy("createdAt", "desc")
    .limit(300)
    .get();

  const equipment: Equipment[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return NextResponse.json({ equipment });
}
