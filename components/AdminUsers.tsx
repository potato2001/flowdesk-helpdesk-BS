"use client";

import { FormEvent, useEffect, useState } from "react";

type Role = "REQUESTER" | "AGENT" | "MANAGER" | "ADMIN";
type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  active: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  createdAt: string;
};
type Audit = {
  id: string;
  action: string;
  targetId: string | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
};
const roleNames: Record<Role, string> = {
  REQUESTER: "Requester",
  AGENT: "Agent",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

export function AdminUsers({ notify }: { notify: (message: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const [usersResponse, auditResponse] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/audit"),
    ]);
    if (!usersResponse.ok) {
      setError("Không thể tải danh sách tài khoản.");
      setLoading(false);
      return;
    }
    setUsers((await usersResponse.json()).users);
    if (auditResponse.ok) setLogs((await auditResponse.json()).logs);
    setLoading(false);
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function patchUser(id: string, data: object, message: string) {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok)
      return notify(result.error ?? "Không thể cập nhật tài khoản.");
    setUsers((old) => old.map((user) => (user.id === id ? result.user : user)));
    notify(message);
    void load();
  }
  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        department: form.get("department"),
        role: form.get("role"),
        temporaryPassword: form.get("temporaryPassword"),
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error ?? "Không thể tạo tài khoản.");
    setCreateOpen(false);
    setError("");
    notify(`Đã tạo tài khoản ${result.user.email}`);
    void load();
  }
  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetUser) return;
    const form = new FormData(event.currentTarget);
    await patchUser(
      resetUser.id,
      { temporaryPassword: form.get("temporaryPassword") },
      "Đã đặt mật khẩu tạm và đăng xuất mọi phiên cũ",
    );
    setResetUser(null);
  }
  const locked = (user: AdminUser) =>
    Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());

  return (
    <>
      <div className="heading account-heading">
        <div>
          <p className="eyebrow">QUẢN TRỊ HỆ THỐNG</p>
          <h1>Tài khoản & phân quyền</h1>
          <p>Quản lý quyền truy cập, trạng thái đăng nhập và mật khẩu tạm.</p>
        </div>
        <button className="primary" onClick={() => setCreateOpen(true)}>
          ＋ Thêm tài khoản
        </button>
      </div>
      {error && <p className="login-error">{error}</p>}
      <section className="table-panel account-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">THÀNH VIÊN</p>
            <h2>{loading ? "Đang tải..." : `${users.length} tài khoản`}</h2>
          </div>
        </div>
        <div className="desktop-table">
          <table className="account-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Phòng ban</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <b>{user.name}</b>
                    <small>{user.email}</small>
                  </td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(event) =>
                        void patchUser(
                          user.id,
                          { role: event.target.value },
                          "Đã cập nhật vai trò",
                        )
                      }
                    >
                      {Object.entries(roleNames).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{user.department || "—"}</td>
                  <td>
                    <span
                      className={`account-state ${!user.active || locked(user) ? "blocked" : ""}`}
                    >
                      {!user.active
                        ? "Vô hiệu hóa"
                        : locked(user)
                          ? "Tạm khóa"
                          : "Hoạt động"}
                    </span>
                    {user.mustChangePassword && <small>Cần đổi mật khẩu</small>}
                  </td>
                  <td>
                    <div className="row-actions">
                      {locked(user) && (
                        <button
                          onClick={() =>
                            void patchUser(
                              user.id,
                              { unlock: true },
                              "Đã mở khóa tài khoản",
                            )
                          }
                        >
                          Mở khóa
                        </button>
                      )}
                      <button onClick={() => setResetUser(user)}>
                        Đặt mật khẩu
                      </button>
                      <button
                        className={user.active ? "danger-link" : ""}
                        onClick={() =>
                          void patchUser(
                            user.id,
                            { active: !user.active },
                            user.active
                              ? "Đã vô hiệu hóa tài khoản"
                              : "Đã kích hoạt tài khoản",
                          )
                        }
                      >
                        {user.active ? "Vô hiệu hóa" : "Kích hoạt"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mobile-account-list">
          {users.map((user) => (
            <article key={user.id}>
              <header>
                <div>
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
                <span
                  className={`account-state ${!user.active || locked(user) ? "blocked" : ""}`}
                >
                  {!user.active
                    ? "Đã tắt"
                    : locked(user)
                      ? "Tạm khóa"
                      : "Hoạt động"}
                </span>
              </header>
              <div className="account-mobile-meta">
                <span>{roleNames[user.role]}</span>
                <span>{user.department || "Chưa có phòng ban"}</span>
              </div>
              <footer className="row-actions">
                {locked(user) && (
                  <button
                    onClick={() =>
                      void patchUser(
                        user.id,
                        { unlock: true },
                        "Đã mở khóa tài khoản",
                      )
                    }
                  >
                    Mở khóa
                  </button>
                )}
                <button onClick={() => setResetUser(user)}>Mật khẩu</button>
                <button
                  onClick={() =>
                    void patchUser(
                      user.id,
                      { active: !user.active },
                      "Đã cập nhật trạng thái",
                    )
                  }
                >
                  {user.active ? "Vô hiệu hóa" : "Kích hoạt"}
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>
      <section className="panel audit-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">AUDIT LOG</p>
            <h2>Hoạt động bảo mật gần đây</h2>
          </div>
        </div>
        <div className="audit-list">
          {logs.slice(0, 12).map((log) => (
            <article key={log.id}>
              <i>•</i>
              <div>
                <b>{log.action.replaceAll("_", " ")}</b>
                <small>
                  {log.actor?.name ?? "Hệ thống"} ·{" "}
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>
      {createOpen && (
        <div className="modal-backdrop">
          <form className="modal account-modal" onSubmit={createUser}>
            <header>
              <div>
                <p className="eyebrow">TÀI KHOẢN MỚI</p>
                <h2>Thêm thành viên</h2>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)}>
                ×
              </button>
            </header>
            <div className="modal-body">
              <div className="field-grid">
                <label className="field">
                  <span>Họ tên</span>
                  <input name="name" required />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" required />
                </label>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Vai trò</span>
                  <select name="role" defaultValue="REQUESTER">
                    {Object.entries(roleNames).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Phòng ban</span>
                  <input name="department" />
                </label>
              </div>
              <label className="field">
                <span>Mật khẩu tạm</span>
                <input
                  name="temporaryPassword"
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
              <button
                type="button"
                className="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </button>
              <button className="primary">Tạo tài khoản</button>
            </footer>
          </form>
        </div>
      )}
      {resetUser && (
        <div className="modal-backdrop">
          <form className="modal account-modal" onSubmit={resetPassword}>
            <header>
              <div>
                <p className="eyebrow">ĐẶT LẠI MẬT KHẨU</p>
                <h2>{resetUser.name}</h2>
              </div>
              <button type="button" onClick={() => setResetUser(null)}>
                ×
              </button>
            </header>
            <div className="modal-body">
              <p className="security-note">
                Mọi phiên đăng nhập hiện tại sẽ bị đóng. Người dùng phải đổi mật
                khẩu sau lần đăng nhập kế tiếp.
              </p>
              <label className="field">
                <span>Mật khẩu tạm mới</span>
                <input
                  name="temporaryPassword"
                  type="password"
                  minLength={12}
                  required
                />
              </label>
              <small className="password-rule">
                Ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </small>
            </div>
            <footer>
              <button
                type="button"
                className="secondary"
                onClick={() => setResetUser(null)}
              >
                Hủy
              </button>
              <button className="primary">Đặt lại mật khẩu</button>
            </footer>
          </form>
        </div>
      )}
    </>
  );
}
