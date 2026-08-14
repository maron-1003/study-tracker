import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createInviteCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
};

export default function GroupsPage({ user }) {
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [period, setPeriod] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("group_members")
      .select("group_id, study_groups(id, name, invite_code, owner_id)")
      .eq("user_id", user.id);

    if (error) {
      setMessage("グループを読み込めませんでした。先に groups.sql をSupabaseで実行してください。");
      setIsLoading(false);
      return;
    }

    const nextGroups = (data ?? []).map((item) => item.study_groups).filter(Boolean);
    setGroups(nextGroups);
    setActiveGroupId((current) => current || nextGroups[0]?.id || "");
    setIsLoading(false);
  }, [user.id]);

  const loadGroupDetails = useCallback(async () => {
    if (!activeGroupId) {
      setMembers([]);
      setRecords([]);
      return;
    }

    const { data: memberRows, error: memberError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", activeGroupId);

    if (memberError) {
      setMessage("メンバーを読み込めませんでした。");
      return;
    }

    const userIds = (memberRows ?? []).map((member) => member.user_id);
    if (userIds.length === 0) return;

    const [{ data: usersData, error: usersError }, { data: recordsData, error: recordsError }] = await Promise.all([
      supabase.from("users").select("id, nickname").in("id", userIds),
      supabase.from("study_records").select("user_id, minutes, date").in("user_id", userIds),
    ]);

    if (usersError || recordsError) {
      setMessage("ランキングを読み込めませんでした。閲覧権限を確認してください。");
      return;
    }

    setMembers(usersData ?? []);
    setRecords(recordsData ?? []);
  }, [activeGroupId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadGroups(), 0);
    return () => window.clearTimeout(timerId);
  }, [loadGroups]);

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadGroupDetails(), 0);
    return () => window.clearTimeout(timerId);
  }, [loadGroupDetails]);

  const activeGroup = groups.find((group) => group.id === activeGroupId);
  const ranking = useMemo(() => {
    const today = new Date();
    const todayString = toDateString(today);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekStartString = toDateString(weekStart);
    const monthString = todayString.slice(0, 7);

    const totals = records.reduce((result, record) => {
      const inPeriod =
        (period === "today" && record.date === todayString) ||
        (period === "week" && record.date >= weekStartString && record.date <= todayString) ||
        (period === "month" && record.date.startsWith(monthString) && record.date <= todayString);
      if (inPeriod) result[record.user_id] = (result[record.user_id] ?? 0) + record.minutes;
      return result;
    }, {});

    return members
      .map((member) => ({ ...member, minutes: totals[member.id] ?? 0 }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [members, period, records]);

  const createGroup = async (event) => {
    event.preventDefault();
    if (!groupName.trim()) return;
    setMessage("");

    const { data: group, error: groupError } = await supabase
      .from("study_groups")
      .insert({ name: groupName.trim(), invite_code: createInviteCode(), owner_id: user.id })
      .select()
      .single();

    if (groupError || !group) {
      setMessage("グループを作成できませんでした。もう一度試してください。");
      return;
    }

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id });

    if (memberError) {
      setMessage("グループは作成されましたが、参加処理に失敗しました。");
      return;
    }

    setGroupName("");
    await loadGroups();
    setActiveGroupId(group.id);
    setMessage(`「${group.name}」を作成しました。`);
  };

  const joinGroup = async (event) => {
    event.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setMessage("");

    const { data: group, error: groupError } = await supabase
      .from("study_groups")
      .select("id, name")
      .eq("invite_code", code)
      .single();

    if (groupError || !group) {
      setMessage("招待コードが見つかりません。");
      return;
    }

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id });

    if (memberError) {
      setMessage("すでに参加済みか、参加処理に失敗しました。");
      return;
    }

    setInviteCode("");
    await loadGroups();
    setActiveGroupId(group.id);
    setMessage(`「${group.name}」に参加しました。`);
  };

  const leaveGroup = async () => {
    if (!activeGroup || activeGroup.owner_id === user.id) {
      setMessage("グループ作成者は退会できません。別のグループを作成してください。");
      return;
    }

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", activeGroup.id)
      .eq("user_id", user.id);

    if (error) {
      setMessage("退会できませんでした。");
      return;
    }

    setActiveGroupId("");
    await loadGroups();
    setMessage("グループから退会しました。");
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section className="rounded-xl bg-gray-800 p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-emerald-300">グループ</h1>
        <p className="mt-1 text-gray-400">招待コードで仲間を集め、グループ内の勉強時間を競えます。</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <form onSubmit={createGroup} className="rounded-lg bg-gray-700 p-4">
            <h2 className="font-bold">グループを作る</h2>
            <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="例: 英検対策チーム" className="mt-3 w-full rounded bg-gray-600 p-3" />
            <button className="mt-3 rounded bg-emerald-600 px-4 py-2 font-bold hover:bg-emerald-700">作成する</button>
          </form>
          <form onSubmit={joinGroup} className="rounded-lg bg-gray-700 p-4">
            <h2 className="font-bold">招待コードで参加</h2>
            <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="8文字の招待コード" maxLength="8" className="mt-3 w-full rounded bg-gray-600 p-3 uppercase" />
            <button className="mt-3 rounded bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700">参加する</button>
          </form>
        </div>
        {message && <p className="mt-4 text-sm text-yellow-200">{message}</p>}
      </section>

      <section className="rounded-xl bg-gray-800 p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-blue-300">グループ内ランキング</h2>
            {activeGroup && <p className="text-sm text-gray-400">招待コード: <span className="font-mono font-bold text-white">{activeGroup.invite_code}</span></p>}
          </div>
          {activeGroup && activeGroup.owner_id !== user.id && (
            <button onClick={leaveGroup} className="rounded bg-red-600 px-3 py-2 text-sm font-bold hover:bg-red-700">退会する</button>
          )}
        </div>

        {isLoading && <p className="mt-4 text-gray-400">読み込み中...</p>}
        {!isLoading && groups.length === 0 && <p className="mt-4 text-gray-400">まだグループに参加していません。</p>}
        {groups.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {groups.map((group) => (
                <button key={group.id} onClick={() => setActiveGroupId(group.id)} className={`rounded px-3 py-2 ${group.id === activeGroupId ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>
                  {group.name}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {[ ["today", "今日"], ["week", "過去7日"], ["month", "今月"] ].map(([id, label]) => (
                <button key={id} onClick={() => setPeriod(id)} className={`rounded px-3 py-2 text-sm ${period === id ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>{label}</button>
              ))}
            </div>
            <div className="mt-4 divide-y divide-gray-700 rounded-lg bg-gray-900/50">
              {ranking.map((member, index) => (
                <div key={member.id} className={`flex justify-between p-3 ${member.id === user.id ? "bg-blue-900/40" : ""}`}>
                  <span>{index + 1}位</span>
                  <span>{member.nickname}{member.id === user.id ? "（あなた）" : ""}</span>
                  <span>{member.minutes}分</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
