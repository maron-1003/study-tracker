import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import StudyTracker from "./StudyTracker";

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");

  // 🔥 ログイン状態を localStorage で保持
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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

  if (user) {
    return <StudyTracker user={user} onLogout={handleLogout} />;
  }

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
