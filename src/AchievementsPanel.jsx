export default function AchievementsPanel({ achievements }) {
  const earnedCount = achievements.filter((achievement) => achievement.earned).length;

  return (
    <section className="w-full max-w-6xl rounded-xl bg-gray-800 p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-yellow-300">バッジ・実績</h2>
          <p className="text-sm text-gray-400">獲得数: {earnedCount} / {achievements.length}</p>
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
