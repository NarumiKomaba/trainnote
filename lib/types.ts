export type PatternType = "training" | "stretch" | "recovery" | "custom";

export type EquipmentUnit = "kg" | "reps" | "min" | "sec" | "level" | "none";

export type Equipment = {
  id: string;
  name: string;         // "レッグプレス"
  unit: EquipmentUnit;  // kgなど
  note?: string;        // 刻みや注意点
  createdAt: number;
};

export type TrainingPattern = {
  id: string;
  name: string;              // "ジム脚の日" / "家トレ体幹" など
  type: PatternType;
  description?: string;      // 自由記述（やることの大枠）
  allowedEquipmentIds: string[]; // このパターンで使える機材（空なら何でもOK扱いでも）
  tags?: string[];           // 任意（"legs", "core"）
  createdAt: number;
};

export type WeeklyRule = {
  // 0=Sun ... 6=Sat
  dayOfWeek: number;
  patternId: string | null;  // 休みはnull
};

export type UserSettings = {
  uid: string;
  weeklyRules: WeeklyRule[];
  preference: "easy" | "normal" | "hard";
  goalText?: string;         // まずは自由記述でOK
  availableTimeMin?: number; // トレーニングに使える時間
  updatedAt: number;
};

export type PlanItem = {
  name: string;                // 種目名
  equipmentId?: string | null; // 既存機材と紐付けられるなら
  weight?: number | null;      // kg
  reps?: number | null;
  sets?: number | null;
  durationMin?: number | null; // ストレッチ/有酸素など
  note?: string | null;
  reason?: string | null;
};

export type DailyPlan = {
  dateKey: string;       // "2026-01-10"
  patternId: string;
  theme: string;
  items: PlanItem[];
  createdAt: number;
  modelInfo?: { provider: "gemini"; model: string };
};

export type WorkoutResultItem = PlanItem & {
  done: boolean;          // チェック
  // 提案と違う場合のみ変える想定なので、PlanItemをそのまま持つ
};

export type WorkoutLog = {
  dateKey: string;
  patternId: string;
  planId?: string;        // dailyPlan doc id
  items: WorkoutResultItem[];
  completed: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Stamp = {
  dateKey: string;
  stampType: "done" | "partial" | "skipped";
  updatedAt: number;
};
