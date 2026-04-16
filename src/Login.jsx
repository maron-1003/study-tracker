import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("ログイン失敗：" + error.message);
      setLoading(false);
      return;
    }

    // 🔥 App.jsx の onLogin を呼ぶ（画面切り替え用）
    onLogin();

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-blue-500">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          ログイン
        </h1>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
