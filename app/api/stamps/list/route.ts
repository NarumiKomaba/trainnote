import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import type { Stamp } from "@/lib/types";

const ReqSchema = z.object({
  uid: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uid, startDate, endDate } = parsed.data;

  const snap = await adminDb
    .collection(`users/${uid}/stamps`)
    .where("dateKey", ">=", startDate)
    .where("dateKey", "<=", endDate)
    .orderBy("dateKey", "asc")
    .get();

  const stamps: Stamp[] = snap.docs.map((doc) => doc.data() as Stamp);

  return NextResponse.json({ stamps });
}
