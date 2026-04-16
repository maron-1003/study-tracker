import { useState } from "react";
import { supabase } from "./supabase";
import bcrypt from "bcryptjs";

export default function Register({ onRegister, onSwitchToLogin }) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nickname || !password || !confirm) {
      alert("すべて入力してください");
      return;
    }

    if (password !== confirm) {
      alert("パスワードが一致しません");
      return;
    }

    setLoading(true);

    // ① ニックネームの重複チェック
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("nickname", nickname)
      .single();

    if (existingUser) {
      alert("このニックネームは既に使われています");
      setLoading(false);
      return;
    }

    // ② パスワードをハッシュ化
    const password_hash = await bcrypt.hash(password, 10);

    // ③ Supabase に登録
    const { data, error } = await supabase
      .from("users")
      .insert([{ nickname, password_hash }])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("登録に失敗しました");
      setLoading(false);
      return;
    }

    // ④ 登録成功 → App.jsx にユーザー情報を渡す
    onRegister({ id: data.id, nickname: data.nickname });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-green-500">
        <h1 className="text-3xl font-bold text-green-400 mb-6 text-center">
          新規登録
        </h1>

        <input
          type="text"
          placeholder="ニックネーム"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 focus:outline-none"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 focus:outline-none"
        />

        <input
          type="password"
          placeholder="パスワード（確認）"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full p-3 mb-6 rounded bg-gray-700 focus:outline-none"
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 p-3 rounded font-bold transition disabled:bg-gray-600"
        >
          {loading ? "登録中..." : "登録"}
        </button>

        <p className="text-center text-gray-400 mt-4">
          すでにアカウントがある？{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-green-400 underline"
          >
            ログイン
          </button>
        </p>
      </div>
    </div>
  );
}
