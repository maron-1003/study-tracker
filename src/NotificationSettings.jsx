const notificationTypes = [
  { id: "pomodoro", label: "ポモドーロ終了", test: "集中・休憩終了を通知します" },
  { id: "achievement", label: "バッジ獲得", test: "新しいバッジの獲得を通知します" },
  { id: "goal", label: "目標達成", test: "日次・期間目標の達成を通知します" },
  { id: "reminder", label: "毎日20時のリマインド", test: "今日まだ勉強していないことを通知します" },
];

export default function NotificationSettings({ settings, onToggle, onTest, onRequestPermission }) {
  const permissionState = typeof Notification !== "undefined" ? Notification.permission : "unsupported";

  return (
    <section className="w-full max-w-6xl rounded-xl bg-gray-800 p-5 shadow-lg">
      <h2 className="text-xl font-bold text-sky-300">通知設定</h2>
      <p className="mb-4 text-sm text-gray-400">
        {permissionState === "granted"
          ? "通知は許可されています。各種類を個別に切り替えられます。"
          : permissionState === "denied"
            ? "通知がブロックされています。ブラウザ設定で許可を変更してください。"
            : "通知を許可してから、各種類を個別に切り替えられます。"}
      </p>

      {permissionState !== "granted" && (
        <div className="mb-4 space-y-2 rounded-lg border border-sky-500/60 bg-sky-500/10 p-3 text-sm text-sky-100">
          <p>通知を有効にすると、目標達成やリマインドを自然に受け取れます。</p>
          <button
            onClick={onRequestPermission}
            className="rounded bg-sky-600 px-3 py-2 font-bold hover:bg-sky-700"
          >
            通知を許可する
          </button>
        </div>
      )}

      {permissionState === "denied" && (
        <div className="mb-4 rounded-lg border border-yellow-500/60 bg-yellow-500/10 p-3 text-sm text-yellow-100">
          Android / iPhone ではブラウザ設定から通知を許可してください。許可後、再度この画面で通知を有効にしてください。
        </div>
      )}

      <div className="space-y-2">
        {notificationTypes.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-700 p-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings[item.id]}
                onChange={() => onToggle(item.id)}
                className="h-4 w-4 accent-sky-500"
              />
              <span>
                <span className="block font-bold">{item.label}</span>
                <span className="text-xs text-gray-400">{item.test}</span>
              </span>
            </label>
            <button
              onClick={() => onTest(item.id)}
              className="rounded bg-sky-600 px-3 py-1 text-sm font-bold hover:bg-sky-700"
            >
              テスト通知
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
