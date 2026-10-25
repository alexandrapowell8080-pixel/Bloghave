"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";

export function LoginForm({ hint, nextPath }: { hint: boolean; nextPath: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <main className="login-screen">
      <form
        className="login-card"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          setPending(false);
          if (!response.ok) {
            setError(data.error || "The desk stayed shut.");
            return;
          }
          location.href = nextPath;
        }}
      >
        <Logo />
        <h1>Open the desk.</h1>
        <p>Stories, questions, and the keys that carry them live behind this door.</p>
        {hint ? <p className="hint">This desk still opens with the first password: <strong>bloghave</strong>. Change it under Desks once you are in.</p> : null}
        <label className="field" style={{ marginTop: 14 }}>
          <span>Password</span>
          <input type="password" value={password} autoFocus onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="bad">{error}</p> : null}
        <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={pending} type="submit">
          {pending ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
