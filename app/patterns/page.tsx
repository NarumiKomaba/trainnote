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
    <div className="page">
      <PageHeader
        title="パターン"
        subtitle="今日やること＋使える機材をまとめて管理します。"
        showBack
        actions={
          <div className="row">
            <Link className="button button--primary" href="/patterns/new">
              ＋ 新規作成
            </Link>
          </div>
        }
      />

      {msg ? <div className="notice">{msg}</div> : null}

      <div className="stack">
        {loading ? (
          <div className="page-subtitle">読み込み中...</div>
        ) : patterns.length === 0 ? (
          <div className="notice warning">まだパターンがありません。「新規作成」から作ってください。</div>
        ) : (
          patterns.map((p) => (
            <Link key={p.id} href={`/patterns/${p.id}`} className="card pattern-card">
              <div className="row space-between">
                <div>
                  <div className="section-title">{p.name}</div>
                  <div className="page-subtitle">{typeLabel(p.type)}</div>
                </div>
                <div className="page-subtitle">ID: {p.id}</div>
              </div>

              {p.description ? (
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{p.description}</div>
              ) : (
                <div className="page-subtitle">（自由記述なし）</div>
              )}

              <div className="page-subtitle">
                使える機材: {p.allowedEquipmentIds?.length ? `${p.allowedEquipmentIds.length} 件` : "制限なし/未設定"}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
