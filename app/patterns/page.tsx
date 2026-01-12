"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import type { TrainingPattern } from "@/lib/types";

const FAKE_UID = "demo-user";

function typeLabel(t: TrainingPattern["type"]) {
  if (t === "training") return "トレーニング";
  if (t === "stretch") return "ストレッチ";
  if (t === "recovery") return "リカバリー";
  return "カスタム";
}

export default function PatternsPage() {
  const uid = FAKE_UID;

  const [patterns, setPatterns] = useState<TrainingPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/patterns/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed");
      setPatterns(json.patterns ?? []);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-4">
      <PageHeader
        title="パターン"
        subtitle="今日やること＋使える機材をまとめて管理します。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" href="/patterns/new">
              ＋ 新規作成
            </Link>
            <button
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              onClick={load}
            >
              更新
            </button>
          </div>
        }
      />

      {msg ? <div className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-slate-700">{msg}</div> : null}

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : patterns.length === 0 ? (
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            まだパターンがありません。「新規作成」から作ってください。
          </div>
        ) : (
          patterns.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">{typeLabel(p.type)}</div>
                </div>
                <div className="text-xs text-slate-400">ID: {p.id}</div>
              </div>

              {p.description ? (
                <div className="whitespace-pre-wrap text-sm text-slate-700">{p.description}</div>
              ) : (
                <div className="text-xs text-slate-500">（自由記述なし）</div>
              )}

              <div className="text-xs text-slate-500">
                使える機材: {p.allowedEquipmentIds?.length ? `${p.allowedEquipmentIds.length} 件` : "制限なし/未設定"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
