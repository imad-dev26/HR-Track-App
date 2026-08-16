import { useAuthStore } from "@store/authStore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { User } from "@app-types/index";
import styles from "./Login.module.css";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call backend Tauri auth command which verifies password securely
      const user = await invoke<User>("login", { username, password });
      // The returned object intentionally does not include password_hash
      login(user as User);
      navigate("/");
    } catch (err) {
      const msg = typeof err === "string" ? err : "Erreur de connexion.";
      setError(msg || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Users size={40} color="var(--primary-600)" />
        </div>
        <h1 className={styles.title}>HR Track</h1>
        <p className={styles.subtitle}>Gestion du Personnel</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nom d'utilisateur</label>
            <div className={styles.inputWrapper}>
              <UserIcon size={18} className={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
                required
                autoFocus
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Mot de passe</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
                className={styles.input}
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className={styles.hint}>
            <p>Utilisateur par défaut: <strong>admin</strong> / Mot de passe: <strong>admin123</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
