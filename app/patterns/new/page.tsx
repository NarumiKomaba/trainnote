"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
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
    <div className="page">
      <PageHeader
        title="パターン作成"
        subtitle="やること（自由記述）と使える機材をセットで登録します。"
        showBack
        actions={
          <div className="row">
            <Link className="button button--ghost" href="/patterns">
              戻る
            </Link>
            <button className="button button--primary" onClick={save} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        }
      />

      {msg ? <div className="notice">{msg}</div> : null}

      <section className="card">
        <div className="section-title">基本情報</div>

        <div className="stack">
          <label className="stack gap-xs">
            <span className="label">パターン名</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ジム脚 / 家トレ体幹 / ストレッチ20分"
              className="input"
            />
          </label>

          <div className="stack gap-xs">
            <span className="label">タイプ</span>
            <div className="row" style={{ flexWrap: "wrap" }}>
              {TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setType(o.value)}
                  className={`chip${type === o.value ? " chip--active" : ""}`}
                >
                  <div style={{ fontWeight: 700 }}>{o.label}</div>
                  <div className="page-subtitle" style={{ marginTop: 2 }}>
                    {o.hint}
                  </div>
                </button>
              ))}
            </div>
            <div className="page-subtitle">{typeHint}</div>
          </div>

          <label className="stack gap-xs">
            <span className="label">やること（自由記述）</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                "例：\n・ウォームアップ 5分\n・脚：レッグプレス / レッグエクステンション\n・余裕があれば有酸素10分\n\n※ここはGeminiが“今日の提案”を作る時の制約・意図として使います"
              }
              className="textarea"
            />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="row space-between">
          <div className="section-title">使える機材（任意）</div>
          <Link className="icon-button" href="/equipment" aria-label="機材を編集">
            <span className="material-symbols-outlined" aria-hidden="true">
              edit
            </span>
          </Link>
        </div>
        <div className="page-subtitle">
          ここで選んだ機材をGeminiの提案に渡します。未選択の場合は「制限なし」として扱います。
        </div>

        <div className="row" style={{ flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="機材を検索（例：プレス、ロー、ダンベル）"
            className="input"
            style={{ flex: "1 1 220px" }}
          />
          <button
            type="button"
            onClick={selectAllFiltered}
            disabled={loading || filtered.length === 0}
            className="button"
          >
            表示中を全選択
          </button>
          <button type="button" onClick={clearSelection} disabled={Object.keys(selected).length === 0} className="button">
            解除
          </button>
        </div>

        <div>
          {loading ? (
            <div className="page-subtitle">機材を読み込み中...</div>
          ) : equipment.length === 0 ? (
            <div className="notice warning">まだ機材が登録されていません。機材未選択でもパターンは作成できます。</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {filtered.map((e) => {
                const checked = !!selected[e.id];
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggle(e.id)}
                    className={`card${checked ? "" : ""}`}
                    style={{ textAlign: "left", border: checked ? "2px solid #111827" : "1px solid var(--border)" }}
                  >
                    <div className="row space-between">
                      <div style={{ fontWeight: 700 }}>{e.name}</div>
                      <div className="page-subtitle">{e.unit}</div>
                    </div>
                    {e.note ? <div className="page-subtitle">{e.note}</div> : null}
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
