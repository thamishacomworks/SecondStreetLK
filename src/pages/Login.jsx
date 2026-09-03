import { useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      console.error(error);
      setErrorMessage(
        "Email or password is incorrect."
      );
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-brand-mark">
            S
          </div>

          <div>
            <h1>Second Street</h1>
            <span>LK</span>
          </div>
        </div>

        <div className="login-heading">
          <LockKeyhole size={28} />

          <div>
            <h2>Welcome Back</h2>
            <p>
              Sign in to access the inventory
              management system.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage && (
            <div className="login-error">
              {errorMessage}
            </div>
          )}

          <button
            className="primary-button login-button"
            type="submit"
            disabled={loading}
          >
            <LogIn size={18} />

            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}