import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import StudyTracker from "./StudyTracker";

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");

  // 🔥 ログイン状態を localStorage で保持
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleRegister = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setMode("login");
  };

  // 🔥 user がいれば StudyTracker を表示
  if (user) {
    return <StudyTracker user={user} onLogout={handleLogout} />;
  }

  // 🔥 user がいないときだけ login/register
  return (
    <div>
      {mode === "login" && (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setMode("register")}
        />
      )}

      {mode === "register" && (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setMode("login")}
        />
      )}
    </div>
  );
}
