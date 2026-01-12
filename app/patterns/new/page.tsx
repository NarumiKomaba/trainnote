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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-4">
      <PageHeader
        title="パターン作成"
        subtitle="やること（自由記述）と使える機材をセットで登録します。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              href="/patterns"
            >
              戻る
            </Link>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={save}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        }
      />

      {msg ? <div className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-slate-700">{msg}</div> : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">基本情報</div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">パターン名</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ジム脚 / 家トレ体幹 / ストレッチ20分"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500">タイプ</span>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setType(o.value)}
                  className={`flex min-w-[150px] flex-1 flex-col gap-1 rounded-xl border px-4 py-3 text-left ${
                    type === o.value ? "border-slate-900" : "border-slate-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{o.label}</div>
                  <div className="text-xs text-slate-500">{o.hint}</div>
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500">選択中: {typeHint}</div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">やること（自由記述）</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                "例：\n・ウォームアップ 5分\n・脚：レッグプレス / レッグエクステンション\n・余裕があれば有酸素10分\n\n※ここはGeminiが“今日の提案”を作る時の制約・意図として使います"
              }
              className="min-h-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm font-semibold">使える機材（任意）</div>
          <div className="text-xs text-slate-500">
            ここで選んだ機材をGeminiの提案に渡します。未選択の場合は「制限なし」として扱います。
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="機材を検索（例：プレス、ロー、ダンベル）"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={selectAllFiltered}
            disabled={loading || filtered.length === 0}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            表示中を全選択
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={Object.keys(selected).length === 0}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            解除
          </button>
          <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            選択: {selectedIds.length} 件
          </div>
        </div>

        <div>
          {loading ? (
            <div className="text-sm text-slate-500">機材を読み込み中...</div>
          ) : equipment.length === 0 ? (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              まだ機材が登録されていません。機材未選択でもパターンは作成できます。
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((e) => {
                const checked = !!selected[e.id];
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggle(e.id)}
                    className={`flex flex-col gap-2 rounded-2xl border bg-white p-3 text-left shadow-sm ${
                      checked ? "border-slate-900" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                      <div className="text-xs text-slate-500">{e.unit}</div>
                    </div>
                    {e.note ? <div className="text-xs text-slate-500">{e.note}</div> : null}
                    <div className="text-xs text-slate-500">{checked ? "選択中" : "未選択"}</div>
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
