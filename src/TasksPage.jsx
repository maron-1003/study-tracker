import { useMemo, useState } from "react";

const storageKey = (userId) => `studyTasks:${userId}`;

const formatMinutes = (minutes) => {
  if (!minutes) return "予定時間なし";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}時間${rest}分` : `${rest}分`;
};

export default function TasksPage({ userId, subjects }) {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(storageKey(userId));
    return saved ? JSON.parse(saved) : [];
  });
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(() => subjects[0] ?? "");
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  const saveTasks = (nextTasks) => {
    setTasks(nextTasks);
    localStorage.setItem(storageKey(userId), JSON.stringify(nextTasks));
  };

  const addTask = (event) => {
    event.preventDefault();
    if (!title.trim()) return;

    saveTasks([
      ...tasks,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        subject,
        dueDate,
        estimatedMinutes: Number(estimatedMinutes) || 0,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setTitle("");
    setDueDate("");
    setEstimatedMinutes("");
  };

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }),
    [tasks]
  );

  const today = new Date().toISOString().slice(0, 10);
  const incompleteCount = tasks.filter((task) => !task.completed).length;

  return (
    <div className="w-full max-w-6xl">
      <section className="rounded-xl bg-gray-800 p-6 shadow-lg">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-blue-300">タスク</h1>
            <p className="text-gray-400">残り {incompleteCount} 件</p>
          </div>
        </div>

        <form onSubmit={addTask} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例: 数学ワーク p.20〜30"
            className="rounded bg-gray-700 p-3"
            aria-label="タスク名"
          />
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded bg-gray-700 p-3">
            {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="rounded bg-gray-700 p-3"
            aria-label="期限"
          />
          <input
            type="number"
            min="1"
            value={estimatedMinutes}
            onChange={(event) => setEstimatedMinutes(event.target.value)}
            placeholder="予定（分）"
            className="rounded bg-gray-700 p-3"
            aria-label="予定時間（分）"
          />
          <button className="rounded bg-blue-600 px-5 py-3 font-bold hover:bg-blue-700">追加</button>
        </form>

        <p className="mt-2 text-xs text-gray-400">期限と予定時間は任意です。期限は未来の日付も設定できます。</p>

        <div className="mt-6 space-y-2">
          {sortedTasks.length === 0 && <p className="text-gray-400">タスクはまだありません。</p>}
          {sortedTasks.map((task) => {
            const isOverdue = !task.completed && task.dueDate && task.dueDate < today;
            return (
              <div key={task.id} className={`flex flex-wrap items-center gap-3 rounded-lg p-4 ${task.completed ? "bg-gray-700/50 opacity-60" : "bg-gray-700"}`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => saveTasks(tasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item))}
                  className="h-5 w-5 accent-green-500"
                  aria-label={`${task.title}を完了にする`}
                />
                <div className="min-w-48 flex-1">
                  <p className={`font-bold ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                  <p className="text-sm text-gray-400">{task.subject} ・ {formatMinutes(task.estimatedMinutes)}</p>
                </div>
                <p className={`text-sm ${isOverdue ? "font-bold text-red-300" : "text-gray-300"}`}>
                  {task.dueDate ? `${isOverdue ? "期限切れ: " : "期限: "}${task.dueDate}` : "期限なし"}
                </p>
                <button
                  onClick={() => saveTasks(tasks.filter((item) => item.id !== task.id))}
                  className="rounded bg-red-600 px-3 py-1 text-sm hover:bg-red-700"
                >
                  削除
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
