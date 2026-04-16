import { useState } from "react";
import { supabase } from "./supabase";
import bcrypt from "bcryptjs";

export default function Login({ onLogin, onSwitchToRegister }) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!nickname || !password) {
      alert("ニックネームとパスワードを入力してください");
      return;
    }

    setLoading(true);

    // ① ニックネームでユーザー検索
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("nickname", nickname)
      .single();

    if (error || !user) {
      alert("ユーザーが見つかりません");
      setLoading(false);
      return;
    }

    // ② パスワード照合
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      alert("パスワードが違います");
      setLoading(false);
      return;
    }

    // ③ ログイン成功 → App.jsx にユーザー情報を渡す
    onLogin({ id: user.id, nickname: user.nickname });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-blue-500">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          ログイン
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
          className="w-full p-3 mb-6 rounded bg-gray-700 focus:outline-none"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded font-bold transition disabled:bg-gray-600"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>

        <p className="text-center text-gray-400 mt-4">
          アカウントがない？{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-400 underline"
          >
            新規登録
          </button>
        </p>
      </div>
    </div>
  );
}
