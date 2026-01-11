"use client";

import React, { useEffect, useState } from "react";
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
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>パターン</h1>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            「今日やること（自由記述）」＋「使える機材」をひとまとまりで管理
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="/patterns/new"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              textDecoration: "none",
            }}
          >
            ＋ 新規作成
          </a>
          <button
            onClick={load}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            更新
          </button>
        </div>
      </header>

      {msg ? (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
      ) : null}

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {loading ? (
          <div style={{ opacity: 0.7 }}>読み込み中...</div>
        ) : patterns.length === 0 ? (
          <div style={{ padding: 12, borderRadius: 12, background: "#fff7e6" }}>
            まだパターンがありません。「新規作成」から作ってください。
          </div>
        ) : (
          patterns.map((p) => (
            <div key={p.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 850, fontSize: 16 }}>{p.name}</div>
                  <div style={{ opacity: 0.7, fontSize: 13, marginTop: 4 }}>{typeLabel(p.type)}</div>
                </div>
                <div style={{ opacity: 0.6, fontSize: 12 }}>ID: {p.id}</div>
              </div>

              {p.description ? (
                <div style={{ marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.5, opacity: 0.9 }}>
                  {p.description}
                </div>
              ) : (
                <div style={{ marginTop: 10, opacity: 0.6 }}>（自由記述なし）</div>
              )}

              <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
                使える機材: {p.allowedEquipmentIds?.length ? `${p.allowedEquipmentIds.length} 件` : "制限なし/未設定"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
