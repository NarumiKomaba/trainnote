"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import type { Equipment, EquipmentUnit } from "@/lib/types";

const FAKE_UID = "demo-user";

const UNIT_OPTIONS: { value: EquipmentUnit; label: string; hint: string }[] = [
  { value: "kg", label: "kg", hint: "筋トレ（重量）" },
  { value: "reps", label: "reps", hint: "回数中心（自重など）" },
  { value: "min", label: "min", hint: "時間（ストレッチ/有酸素）" },
  { value: "sec", label: "sec", hint: "秒（プランクなど）" },
  { value: "level", label: "level", hint: "強度レベル（バイク等）" },
  { value: "none", label: "none", hint: "記録しない（補助）" },
];

export default function EquipmentPage() {
  const uid = FAKE_UID;

  const [list, setList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // form
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<EquipmentUnit>("kg");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) => e.name.toLowerCase().includes(q) || (e.note ?? "").toLowerCase().includes(q));
  }, [list, search]);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/equipment/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load");
      setList(json.equipment ?? []);
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

  async function create() {
    setSaving(true);
    setMsg("");
    try {
      if (!name.trim()) throw new Error("機材名を入力してください");

      const res = await fetch("/api/equipment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, name: name.trim(), unit, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ? JSON.stringify(json.error) : "Failed to create");

      // reset
      setName("");
      setNote("");
      setUnit("kg");

      await load();
      setMsg("追加しました");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function remove(equipmentId: string) {
    const ok = window.confirm("この機材を削除しますか？（パターンで使っている場合は手動で調整してください）");
    if (!ok) return;

    setMsg("");
    try {
      const res = await fetch("/api/equipment/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, equipmentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete");
      await load();
      setMsg("削除しました");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to delete");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-4">
      <PageHeader
        title="機材"
        subtitle="使える道具・種目を登録して提案の材料にします。"
        actions={
          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={load}
            disabled={loading}
          >
            更新
          </button>
        }
      />

      {msg ? <div className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-slate-700">{msg}</div> : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">追加</div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">機材名</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：レッグプレス、ダンベル、プランク"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">単位</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value as EquipmentUnit)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}（{o.hint}）
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">メモ（任意）</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：プレート刻み2.5kg / MAX50kg / マシン番号など"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <div className="flex justify-end">
            <button
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={create}
              disabled={saving}
            >
              {saving ? "追加中..." : "追加"}
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">一覧</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="検索（例：プレス、ロー、ストレッチ）"
            className="w-full max-w-[220px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          {loading ? (
            <div className="text-sm text-slate-500">読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {list.length === 0 ? "まだ機材がありません。上で追加してください。" : "検索条件に一致する機材がありません。"}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((e) => (
                <div key={e.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{e.name}</div>
                      <div className="text-xs text-slate-500">unit: {e.unit} / id: {e.id}</div>
                    </div>
                  </div>

                  {e.note ? <div className="text-xs text-slate-500">{e.note}</div> : null}

                  <div className="flex justify-end">
                    <button
                      onClick={() => remove(e.id)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
