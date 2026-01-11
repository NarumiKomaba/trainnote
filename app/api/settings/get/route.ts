import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import type { UserSettings } from "@/lib/types";

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

  const snap = await adminDb.doc(`users/${uid}/settings/main`).get();
  const settings = snap.exists ? (snap.data() as UserSettings) : null;

  return NextResponse.json({ settings });
}
