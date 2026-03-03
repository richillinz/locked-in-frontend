"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      login(data.token, data.user);
      onClose();
    } catch (e) {
      setError("Connection error");
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "4px" }}>LOCKED-IN</div>
          <div style={{ fontSize: "10px", color: "#444", letterSpacing: "3px", marginTop: "4px" }}>{mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</div>
        </div>

        {mode === "register" && (
          <input
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            style={{ width: "100%", padding: "12px", background: "#0d0d12", border: "1px solid #1a1a28", borderRadius: "8px", color: "#fff", fontSize: "13px", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}
          />
        )}
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          style={{ width: "100%", padding: "12px", background: "#0d0d12", border: "1px solid #1a1a28", borderRadius: "8px", color: "#fff", fontSize: "13px", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === "Enter" && submit()}
          style={{ width: "100%", padding: "12px", background: "#0d0d12", border: "1px solid #1a1a28", borderRadius: "8px", color: "#fff", fontSize: "13px", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}
        />

        {error && <div style={{ color: "#ff4444", fontSize: "12px", marginBottom: "12px", textAlign: "center" }}>{error}</div>}

        <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "14px", background: "#ff4422", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontFamily: "'Courier New', monospace", letterSpacing: "3px", fontWeight: "700", marginBottom: "12px" }}>
          {loading ? "..." : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>

        <div style={{ textAlign: "center", fontSize: "11px", color: "#444" }}>
          {mode === "login" ? "No account? " : "Have an account? "}
          <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "#ff4422", cursor: "pointer" }}>
            {mode === "login" ? "Register" : "Login"}
          </span>
        </div>

        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "#444", fontSize: "18px" }}>×</button>
      </div>
    </div>
  );
}
