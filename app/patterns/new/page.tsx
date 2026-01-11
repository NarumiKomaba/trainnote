"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Equipment, TrainingPattern } from "@/lib/types";

const FAKE_UID = "demo-user";

const TYPE_OPTIONS: { value: TrainingPattern["type"]; label: string; hint: string }[] = [
  { value: "training", label: "トレーニング", hint: "筋トレ/有酸素など（重量/回数/セット提案向き）" },
  { value: "stretch", label: "ストレッチ", hint: "時間中心（durationMin提案）" },
  { value: "recovery", label: "リカバリー", hint: "軽め/回復を優先" },
  { value: "custom", label: "カスタム", hint: "自由に使う" },
];

export default function PatternNewPage() {
  const uid = FAKE_UID;

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState<TrainingPattern["type"]>("training");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return equipment;
    return equipment.filter((e) => e.name.toLowerCase().includes(q) || (e.note ?? "").toLowerCase().includes(q));
  }, [equipment, search]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const res = await fetch("/api/equipment/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load equipment");
        setEquipment(json.equipment ?? []);
      } catch (e: any) {
        setMsg(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = { ...prev };
      for (const e of filtered) next[e.id] = true;
      return next;
    });
  }

  function clearSelection() {
    setSelected({});
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      if (!name.trim()) {
        throw new Error("パターン名を入力してください");
      }

      const res = await fetch("/api/patterns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          name: name.trim(),
          type,
          description,
          allowedEquipmentIds: selectedIds,
          tags: [],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ? JSON.stringify(json.error) : "Failed to create");

      // 作成後は一覧へ
      window.location.href = "/patterns";
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const typeHint = TYPE_OPTIONS.find((o) => o.value === type)?.hint ?? "";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>パターン作成</h1>
          <div style={{ opacity: 0.7, fontSize: 13 }}>やること（自由記述）と、使える機材をセットで登録</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="/patterns"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "white",
              textDecoration: "none",
            }}
          >
            戻る
          </a>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              cursor: "pointer",
            }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </header>

      {msg ? (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
      ) : null}

      <section style={{ marginTop: 14, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 750 }}>基本情報</h2>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>パターン名</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ジム脚 / 家トレ体幹 / ストレッチ20分"
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
            />
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>タイプ</span>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setType(o.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: type === o.value ? "2px solid #111" : "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                    textAlign: "left",
                    minWidth: 160,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{o.label}</div>
                  <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>{o.hint}</div>
                </button>
              ))}
            </div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>選択中: {typeHint}</div>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>やること（自由記述）</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                "例：\n・ウォームアップ 5分\n・脚：レッグプレス / レッグエクステンション\n・余裕があれば有酸素10分\n\n※ここはGeminiが“今日の提案”を作る時の制約・意図として使います"
              }
              style={{
                width: "100%",
                minHeight: 140,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #ddd",
                resize: "vertical",
              }}
            />
          </label>
        </div>
      </section>

      <section style={{ marginTop: 14, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 750 }}>使える機材（任意）</h2>
        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
          ここで選んだ機材をGeminiの提案に渡します。未選択の場合は「制限なし」として扱います。
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="機材を検索（例：プレス、ロー、ダンベル）"
            style={{ flex: "1 1 260px", padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
          />
          <button
            type="button"
            onClick={selectAllFiltered}
            disabled={loading || filtered.length === 0}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white" }}
          >
            表示中を全選択
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={Object.keys(selected).length === 0}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white" }}
          >
            解除
          </button>
          <div style={{ opacity: 0.8, fontSize: 13 }}>選択: {selectedIds.length} 件</div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ opacity: 0.7 }}>機材を読み込み中...</div>
          ) : equipment.length === 0 ? (
            <div style={{ padding: 12, borderRadius: 12, background: "#fff7e6" }}>
              まだ機材が登録されていません。機材未選択でもパターンは作成できます（制限なし扱い）。
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 10,
                marginTop: 10,
              }}
            >
              {filtered.map((e) => {
                const checked = !!selected[e.id];
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggle(e.id)}
                    style={{
                      borderRadius: 14,
                      border: checked ? "2px solid #111" : "1px solid #eee",
                      background: "white",
                      padding: 12,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 850 }}>{e.name}</div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>{e.unit}</div>
                    </div>
                    {e.note ? (
                      <div style={{ marginTop: 6, opacity: 0.7, fontSize: 12, lineHeight: 1.4 }}>
                        {e.note}
                      </div>
                    ) : null}
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                      {checked ? "選択中" : "未選択"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
