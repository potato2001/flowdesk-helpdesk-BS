"use client";

import { FormEvent, useState } from "react";

export function PasswordModal({
  required = false,
  onClose,
  onSaved,
}: {
  required?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      setError("Xác nhận mật khẩu chưa khớp.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Không thể đổi mật khẩu.");
      return;
    }
    onSaved();
  }
  return (
    <div className="modal-backdrop">
      <form className="modal account-modal" onSubmit={submit}>
        <header>
          <div>
            <p className="eyebrow">BẢO MẬT TÀI KHOẢN</p>
            <h2>{required ? "Cần đổi mật khẩu" : "Đổi mật khẩu"}</h2>
          </div>
          {!required && (
            <button type="button" onClick={onClose} aria-label="Đóng">
              ×
            </button>
          )}
        </header>
        <div className="modal-body">
          {required && (
            <p className="security-note">
              Đây là mật khẩu tạm. Hãy đổi mật khẩu trước khi tiếp tục.
            </p>
          )}
          <label className="field">
            <span>Mật khẩu hiện tại</span>
            <input name="currentPassword" type="password" required />
          </label>
          <label className="field">
            <span>Mật khẩu mới</span>
            <input name="newPassword" type="password" minLength={12} required />
          </label>
          <label className="field">
            <span>Xác nhận mật khẩu mới</span>
            <input
              name="confirmPassword"
              type="password"
              minLength={12}
              required
            />
          </label>
          <small className="password-rule">
            Ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
          </small>
          {error && <p className="login-error">{error}</p>}
        </div>
        <footer>
          {!required && (
            <button type="button" className="secondary" onClick={onClose}>
              Hủy
            </button>
          )}
          <button className="primary" disabled={saving}>
            {saving ? "Đang lưu..." : "Đổi mật khẩu"}
          </button>
        </footer>
      </form>
    </div>
  );
}
