"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    return list.filter(
      (e) => e.name.toLowerCase().includes(q) || (e.note ?? "").toLowerCase().includes(q)
    );
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>機材</h1>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            ジム/家トレを区別せず「使える道具・種目」を登録（Gemini提案の材料になる）
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="/app/patterns"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "white",
              textDecoration: "none",
            }}
          >
            パターンへ
          </a>
          <button
            onClick={load}
            disabled={loading}
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

      {/* Create form */}
      <section style={{ marginTop: 14, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 750 }}>追加</h2>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 220px", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>機材名</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：レッグプレス、ダンベル、プランク"
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>単位</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as EquipmentUnit)}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
            >
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}（{o.hint}）
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>メモ（任意）</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：プレート刻み2.5kg / MAX50kg / マシン番号など"
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
          />
        </label>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={create}
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
            {saving ? "追加中..." : "追加"}
          </button>
        </div>
      </section>

      {/* List */}
      <section style={{ marginTop: 14, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 750 }}>一覧</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="検索（例：プレス、ロー、ストレッチ）"
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", minWidth: 280 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ opacity: 0.7 }}>読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 12, borderRadius: 12, background: "#fff7e6" }}>
              {list.length === 0 ? "まだ機材がありません。上で追加してください。" : "検索条件に一致する機材がありません。"}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map((e) => (
                <div
                  key={e.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 14,
                    padding: 12,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div style={{ fontWeight: 850, fontSize: 16 }}>{e.name}</div>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>
                      unit: <b>{e.unit}</b> / id: {e.id}
                    </div>
                  </div>

                  {e.note ? <div style={{ opacity: 0.85, fontSize: 13 }}>{e.note}</div> : null}

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => remove(e.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #ddd",
                        background: "white",
                        cursor: "pointer",
                      }}
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
