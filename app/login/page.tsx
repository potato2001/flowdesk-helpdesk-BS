"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Không thể đăng nhập.");
      setLoading(false);
      return;
    }
    window.location.href = "/";
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span>F</span>
          <div>
            <b>Flowdesk</b>
            <small>Local Helpdesk</small>
          </div>
        </div>
        <div className="login-copy">
          <p className="eyebrow">NOVATECH VIỆT NAM</p>
          <h1>Đăng nhập Helpdesk</h1>
          <p>Sử dụng tài khoản nội bộ để tiếp tục.</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="tenban@congty.local"
              required
              autoComplete="username"
            />
          </label>
          <label>
            Mật khẩu
            <input
              name="password"
              type="password"
              placeholder="Nhập mật khẩu"
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </section>
    </main>
  );
}
