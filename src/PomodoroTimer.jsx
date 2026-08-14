import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestNotificationPermission, sendBrowserNotification } from "./notifications";

const presets = [
  { id: "25-5", label: "25分集中 / 5分休憩", focus: 25, break: 5 },
  { id: "50-10", label: "50分集中 / 10分休憩", focus: 50, break: 10 },
];

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export default function PomodoroTimer({ subject, onFocusComplete, notificationsEnabled }) {
  const [presetId, setPresetId] = useState("25-5");
  const [phase, setPhase] = useState("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");
  const timerRef = useRef(null);

  const preset = useMemo(
    () => presets.find((item) => item.id === presetId) ?? presets[0],
    [presetId]
  );

  const notify = useCallback(async (body) => {
    if (notificationsEnabled) await sendBrowserNotification("Study Tracker", body);
  }, [notificationsEnabled]);

  const reset = () => {
    clearInterval(timerRef.current);
    setPhase("focus");
    setRemainingSeconds(preset.focus * 60);
    setIsRunning(false);
    setMessage("");
  };

  const completePhase = useCallback(async () => {
    if (phase === "focus") {
      const saved = await onFocusComplete(preset.focus);
      if (!saved) {
        setMessage("記録を保存できませんでした。もう一度試してください。");
        return;
      }

      setPhase("break");
      setRemainingSeconds(preset.break * 60);
      setIsRunning(true);
      setMessage(`集中 ${preset.focus}分を自動記録しました。休憩を始めます。`);
      notify(`${preset.focus}分の集中おつかれさま！ ${preset.break}分休憩しましょう。`);
      return;
    }

    setPhase("focus");
    setRemainingSeconds(preset.focus * 60);
    setIsRunning(false);
    setMessage("休憩が終わりました。次の集中を始めましょう。");
    notify("休憩終了。次の集中を始めましょう！");
  }, [notify, onFocusComplete, phase, preset]);

  useEffect(() => {
    if (!isRunning) return undefined;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous > 1) return previous - 1;

        clearInterval(timerRef.current);
        setIsRunning(false);
        void completePhase();
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [completePhase, isRunning]);

  const start = async () => {
    if (phase === "focus" && !subject) {
      setMessage("先に勉強内容を選択してください。");
      return;
    }

    if (notificationsEnabled) await requestNotificationPermission();
    setMessage("");
    setIsRunning(true);
  };

  const changePreset = (event) => {
    const nextPreset = presets.find((item) => item.id === event.target.value) ?? presets[0];
    setPresetId(nextPreset.id);
    setPhase("focus");
    setRemainingSeconds(nextPreset.focus * 60);
    setMessage("");
  };

  return (
    <section className="mt-6 rounded-lg border border-orange-400/50 bg-gray-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-orange-300">🍅 ポモドーロタイマー</h3>
          <p className="text-sm text-gray-400">集中終了時に勉強時間を自動で記録します</p>
        </div>
        <select
          value={presetId}
          onChange={changePreset}
          disabled={isRunning}
          className="rounded bg-gray-700 px-3 py-2 disabled:opacity-50"
        >
          {presets.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="my-4 text-center">
        <p className={`font-bold ${phase === "focus" ? "text-orange-300" : "text-emerald-300"}`}>
          {phase === "focus" ? "集中時間" : "休憩時間"}
        </p>
        <p className="text-5xl font-bold tabular-nums">{formatTime(remainingSeconds)}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={start}
          disabled={isRunning}
          className="flex-1 rounded bg-orange-500 p-3 font-bold hover:bg-orange-600 disabled:bg-gray-600"
        >
          {phase === "focus" ? "集中を開始" : "休憩を開始"}
        </button>
        <button
          onClick={() => setIsRunning(false)}
          disabled={!isRunning}
          className="rounded bg-yellow-500 px-4 font-bold hover:bg-yellow-600 disabled:bg-gray-600"
        >
          一時停止
        </button>
        <button onClick={reset} className="rounded bg-gray-700 px-4 font-bold hover:bg-gray-600">
          リセット
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-gray-300">{message}</p>}
    </section>
  );
}
