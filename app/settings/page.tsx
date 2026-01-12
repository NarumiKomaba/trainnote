"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import type { UserSettings } from "@/lib/types";

const FAKE_UID = "demo-user"; // 後でAuth uidに差し替え

export default function SettingsPage() {
  const uid = FAKE_UID;

  const [preference, setPreference] = useState<UserSettings["preference"]>("normal");
  const [goalText, setGoalText] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const skipInitialSave = useRef(true);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const sRes = await fetch("/api/settings/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });

        const sJson = await sRes.json();

        if (!sRes.ok) throw new Error(sJson?.error ?? "Failed to load settings");

        const settings: UserSettings | null = sJson.settings ?? null;

        setPreference(settings?.preference ?? "normal");
        setGoalText(settings?.goalText ?? "");
      } catch (e: any) {
        setMsg(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  async function saveSettings() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          preference,
          goalText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to save settings");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    if (loading) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      void saveSettings();
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [preference, goalText, loading]);

  return (
    <div className="page">
      <PageHeader title="設定" />
      {msg ? <div className="notice">{msg}</div> : null}

      <section className="card">
        <div className="section-title">提案の強度</div>
        <div className="preference-slider">
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={preference === "easy" ? 0 : preference === "normal" ? 1 : 2}
            onChange={(e) => {
              const value = Number(e.target.value);
              setPreference(value === 0 ? "easy" : value === 1 ? "normal" : "hard");
            }}
          />
          <div className="preference-slider__labels">
            <span>ゆるめ</span>
            <span>標準</span>
            <span>厳しめ</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">目標（自由記述）</div>
        <div className="page-subtitle">例：週3回継続 / 体重-2kg / レッグプレスを伸ばしたい</div>
        <textarea
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="例：週3回継続、脚の筋力UP、ストレッチ習慣"
          className="textarea"
        />
      </section>

      <section className="card">
        <div className="section-title">曜日ごとのパターン</div>
        <div className="page-subtitle">曜日ごとのトレーニングを設定します。</div>
        <Link className="button button--outline" href="/settings/weekly">
          曜日ごとのパターン
        </Link>
      </section>

      <section className="card">
        <div className="section-title">パターン・機材の管理</div>
        <div className="page-subtitle">作成・編集は各画面から行います。</div>
        <div className="settings-links settings-links--compact">
          <Link className="settings-link-card" href="/patterns">
            <span className="settings-link-icon" aria-hidden="true">
              📋
            </span>
            <div className="stack gap-xs">
              <span className="settings-link-title">パターン</span>
              <span className="page-subtitle">トレーニング構成を管理</span>
            </div>
          </Link>
          <Link className="settings-link-card" href="/equipment">
            <span className="settings-link-icon" aria-hidden="true">
              🏋️
            </span>
            <div className="stack gap-xs">
              <span className="settings-link-title">機材</span>
              <span className="page-subtitle">使える機材を登録</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
