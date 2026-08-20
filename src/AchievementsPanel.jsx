import { getLevelInfo } from "./achievements";

export default function AchievementsPanel({ achievements, records = [] }) {
  const earnedCount = achievements.filter((achievement) => achievement.earned).length;
  const levelInfo = getLevelInfo(records);

  return (
    <section className="w-full max-w-6xl rounded-xl bg-gray-800 p-5 shadow-lg">
      <div className="mb-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-yellow-300">バッジ</h2>
          <p className="text-sm text-gray-400">獲得数: {earnedCount} / {achievements.length}</p>
        </div>

        <div className="rounded-lg border border-purple-500/60 bg-purple-500/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-200">LEVEL</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl">{levelInfo.icon}</span>
                <span className="text-2xl font-bold text-white">Lv.{levelInfo.level}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">称号</p>
              <p className="font-bold text-purple-200">{levelInfo.title}</p>
            </div>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded bg-gray-700">
            <div
              className="h-full rounded bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>

          <p className="mt-2 text-sm text-gray-300">
            累計 {Math.floor(levelInfo.totalMinutes)} 分学習中
            {levelInfo.nextLevelMinutes ? ` / 次のレベルまで ${Math.max(Math.ceil((levelInfo.nextLevelMinutes - levelInfo.totalMinutes) / 60), 0)} 時間` : " / 最大レベル"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`rounded-lg border p-3 ${
              achievement.earned
                ? "border-yellow-400/70 bg-yellow-500/10"
                : "border-gray-700 bg-gray-900/50 opacity-55"
            }`}
          >
            <p className="text-2xl">{achievement.earned ? achievement.icon : "🔒"}</p>
            <p className="mt-1 font-bold">{achievement.name}</p>
            <p className="mt-1 text-xs text-gray-400">{achievement.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
