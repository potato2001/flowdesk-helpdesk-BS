"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminUsers } from "@/components/AdminUsers";
import { PasswordModal } from "@/components/PasswordModal";

type Status = "new" | "progress" | "waiting" | "resolved";
type Priority = "high" | "medium" | "low";
type View = "dashboard" | "kanban" | "tickets" | "portal" | "users";
type Role = "requester" | "agent" | "manager" | "admin";
type Ticket = {
  databaseId?: string;
  id: string;
  title: string;
  description: string;
  requester: string;
  department: string;
  status: Status;
  priority: Priority;
  category: string;
  assignee: string;
  assigneeId?: string | null;
  initials: string;
  responseSla: number;
  resolutionSla: number;
};
type Comment = {
  id: number | string;
  author: string;
  initials: string;
  body: string;
  time: string;
  internal?: boolean;
};
type Activity = {
  id: number | string;
  text: string;
  actor: string;
  time: string;
};
type Attachment = {
  id: number | string;
  name: string;
  size: string;
  author: string;
  time: string;
  downloadUrl?: string;
};
type AgentOption = { id: string; name: string };

const seedTickets: Ticket[] = [
  {
    id: "HD-1038",
    title: "Laptop phòng Kế toán khởi động rất chậm",
    description:
      "Máy mất khoảng 12 phút để vào Windows và thường xuyên đứng ở màn hình đăng nhập. Sự cố bắt đầu từ sáng nay sau khi cập nhật hệ thống.",
    requester: "Thanh Vân",
    department: "Kế toán",
    status: "new",
    priority: "high",
    category: "Phần cứng",
    assignee: "Chưa phân công",
    initials: "--",
    responseSla: 18,
    resolutionSla: 228,
  },
  {
    id: "HD-1037",
    title: "Yêu cầu cấp quyền thư mục dự án Phoenix",
    description:
      "Cần quyền chỉnh sửa thư mục dùng chung Phoenix cho nhóm kinh doanh trước buổi họp chiều nay.",
    requester: "Đức Anh",
    department: "Kinh doanh",
    status: "new",
    priority: "medium",
    category: "Tài khoản",
    assignee: "Ngọc Lan",
    initials: "NL",
    responseSla: 96,
    resolutionSla: 480,
  },
  {
    id: "HD-1036",
    title: "Máy in tầng 2 báo lỗi kẹt giấy liên tục",
    description:
      "Máy in HP tại khu vận hành báo kẹt giấy dù đã kiểm tra khay giấy và con lăn.",
    requester: "Mai Chi",
    department: "Vận hành",
    status: "new",
    priority: "low",
    category: "Phần cứng",
    assignee: "Quốc Duy",
    initials: "QD",
    responseSla: 170,
    resolutionSla: 920,
  },
  {
    id: "HD-1035",
    title: "Không nhận được email từ đối tác bên ngoài",
    description:
      "Email từ tên miền đối tác bị từ chối từ 9:15. Giao dịch mua hàng đang bị ảnh hưởng.",
    requester: "Hải Nam",
    department: "Mua hàng",
    status: "progress",
    priority: "high",
    category: "Email",
    assignee: "Minh Tuấn",
    initials: "MT",
    responseSla: 0,
    resolutionSla: 34,
  },
  {
    id: "HD-1034",
    title: "Cài đặt Microsoft Project cho PMO",
    description:
      "Cấp license và cài Microsoft Project cho ba máy của nhóm PMO.",
    requester: "Bảo Ngọc",
    department: "PMO",
    status: "progress",
    priority: "medium",
    category: "Phần mềm",
    assignee: "Ngọc Lan",
    initials: "NL",
    responseSla: 0,
    resolutionSla: 125,
  },
  {
    id: "HD-1033",
    title: "Wi-Fi chập chờn tại phòng họp Lotus",
    description:
      "Kết nối rớt mỗi 3–5 phút khi có trên 10 người tham gia cuộc họp.",
    requester: "Tùng Lâm",
    department: "Hành chính",
    status: "progress",
    priority: "high",
    category: "Mạng & Wi-Fi",
    assignee: "Quốc Duy",
    initials: "QD",
    responseSla: 0,
    resolutionSla: 18,
  },
  {
    id: "HD-1032",
    title: "Cần khôi phục file Excel bị ghi đè",
    description:
      "File ngân sách quý III trên SharePoint bị ghi đè lúc 14:20 hôm qua.",
    requester: "Quỳnh Anh",
    department: "Tài chính",
    status: "waiting",
    priority: "medium",
    category: "Dữ liệu",
    assignee: "Minh Tuấn",
    initials: "MT",
    responseSla: 0,
    resolutionSla: 210,
  },
  {
    id: "HD-1031",
    title: "Không thể kết nối VPN khi làm việc tại nhà",
    description:
      "Ứng dụng VPN dừng ở bước xác thực MFA trên cả Wi-Fi gia đình và 4G.",
    requester: "Thu Hà",
    department: "Nhân sự",
    status: "waiting",
    priority: "high",
    category: "Mạng & Wi-Fi",
    assignee: "Ngọc Lan",
    initials: "NL",
    responseSla: 0,
    resolutionSla: 76,
  },
  {
    id: "HD-1030",
    title: "Bàn giao laptop cho nhân viên mới",
    description:
      "Chuẩn bị laptop và tài khoản cho nhân viên mới bắt đầu vào thứ Hai.",
    requester: "Hồng Phúc",
    department: "Nhân sự",
    status: "waiting",
    priority: "low",
    category: "Onboarding",
    assignee: "Quốc Duy",
    initials: "QD",
    responseSla: 0,
    resolutionSla: 320,
  },
  {
    id: "HD-1029",
    title: "Cập nhật chữ ký email toàn công ty",
    description:
      "Mẫu chữ ký mới đã được Marketing duyệt và cần áp dụng toàn công ty.",
    requester: "Khánh Linh",
    department: "Marketing",
    status: "resolved",
    priority: "low",
    category: "Email",
    assignee: "Ngọc Lan",
    initials: "NL",
    responseSla: 0,
    resolutionSla: 0,
  },
  {
    id: "HD-1028",
    title: "Màn hình phòng họp không nhận tín hiệu HDMI",
    description:
      "Màn hình phòng họp Orchid không nhận tín hiệu từ laptop qua cổng HDMI.",
    requester: "Anh Khoa",
    department: "Ban giám đốc",
    status: "resolved",
    priority: "high",
    category: "Phần cứng",
    assignee: "Quốc Duy",
    initials: "QD",
    responseSla: 0,
    resolutionSla: 0,
  },
  {
    id: "HD-1027",
    title: "Reset mật khẩu tài khoản ERP",
    description: "Tài khoản ERP bị khóa sau nhiều lần nhập sai mật khẩu.",
    requester: "Phương Thảo",
    department: "Kho vận",
    status: "resolved",
    priority: "medium",
    category: "Tài khoản",
    assignee: "Minh Tuấn",
    initials: "MT",
    responseSla: 0,
    resolutionSla: 0,
  },
];

const columns: { key: Status; label: string; dot: string }[] = [
  { key: "new", label: "Mới", dot: "gray" },
  { key: "progress", label: "Đang xử lý", dot: "blue" },
  { key: "waiting", label: "Chờ phản hồi", dot: "amber" },
  { key: "resolved", label: "Đã giải quyết", dot: "green" },
];
const statusLabels: Record<Status, string> = {
  new: "Mới",
  progress: "Đang xử lý",
  waiting: "Chờ phản hồi",
  resolved: "Đã giải quyết",
};
const priorityLabels: Record<Priority, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};
const prioritySymbols: Record<Priority, string> = {
  high: "↑",
  medium: "→",
  low: "↓",
};
const roleLabels: Record<Role, string> = {
  requester: "Requester",
  agent: "Agent",
  manager: "Manager",
  admin: "Admin",
};
const viewLabels: Record<View, string> = {
  dashboard: "Tổng quan",
  kanban: "Bảng công việc",
  tickets: "Tất cả ticket",
  portal: "Cổng nhân viên",
  users: "Quản lý tài khoản",
};

function Sla({
  minutes,
  complete = false,
}: {
  minutes: number;
  complete?: boolean;
}) {
  const cls =
    complete || minutes === 0
      ? "done"
      : minutes < 45
        ? "danger"
        : minutes < 100
          ? "warning"
          : "safe";
  const text =
    complete || minutes === 0
      ? "Hoàn thành"
      : `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
  return <span className={`sla ${cls}`}>{text}</span>;
}
function Avatar({ initials }: { initials: string }) {
  return (
    <span
      className={`avatar avatar-${initials.toLowerCase().replace("--", "none")}`}
    >
      {initials}
    </span>
  );
}
function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority priority-${priority}`}>
      {prioritySymbols[priority]}
    </span>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [role, setRole] = useState<Role>("manager");
  const [currentName, setCurrentName] = useState("Đang tải...");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [tickets, setTickets] = useState(seedTickets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [toast, setToast] = useState("");
  const [comments, setComments] = useState<Record<string, Comment[]>>({
    "HD-1038": [
      {
        id: 1,
        author: "Thanh Vân",
        initials: "TV",
        body: "Máy hiện vẫn khởi động được nhưng rất chậm. Em đã thử khởi động lại hai lần.",
        time: "08:42",
      },
      {
        id: 2,
        author: "Hoàng Anh",
        initials: "HA",
        body: "Đã tiếp nhận. Team sẽ kiểm tra sức khỏe ổ cứng và bản cập nhật gần nhất.",
        time: "09:03",
      },
    ],
  });
  const [activities, setActivities] = useState<Record<string, Activity[]>>({
    "HD-1038": [
      {
        id: 1,
        text: "Ticket được tạo với mức ưu tiên Cao",
        actor: "Thanh Vân",
        time: "08:37",
      },
      {
        id: 2,
        text: "Đã thêm bình luận công khai",
        actor: "Hoàng Anh",
        time: "09:03",
      },
    ],
  });
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({
    "HD-1038": [
      {
        id: 1,
        name: "startup-screen.jpg",
        size: "1.8 MB",
        author: "Thanh Vân",
        time: "08:40",
      },
    ],
  });

  useEffect(() => {
    async function bootstrap() {
      try {
        const [meResponse, ticketResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/tickets"),
        ]);
        if (meResponse.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!meResponse.ok || !ticketResponse.ok)
          throw new Error("Không thể kết nối PostgreSQL local.");
        const meData = await meResponse.json();
        const ticketData = await ticketResponse.json();
        const nextRole = String(meData.user.role).toLowerCase() as Role;
        setRole(nextRole);
        setCurrentName(meData.user.name);
        setPasswordRequired(Boolean(meData.user.mustChangePassword));
        setPasswordModal(Boolean(meData.user.mustChangePassword));
        setTickets(ticketData.tickets);
        if (nextRole !== "requester") {
          const agentResponse = await fetch("/api/users");
          if (agentResponse.ok) setAgents((await agentResponse.json()).users);
        }
        setAuthLoading(false);
      } catch (error) {
        setBootstrapError(
          error instanceof Error
            ? error.message
            : "Không thể khởi tạo Flowdesk local.",
        );
        setAuthLoading(false);
      }
    }
    void bootstrap();
  }, []);

  const visibleTickets = tickets;
  const openCount = visibleTickets.filter(
    (ticket) => ticket.status !== "resolved",
  ).length;
  const resolvedCount = visibleTickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;
  const filtered = useMemo(
    () =>
      visibleTickets.filter(
        (ticket) =>
          (statusFilter === "all" || ticket.status === statusFilter) &&
          `${ticket.id} ${ticket.title} ${ticket.requester}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [visibleTickets, query, statusFilter],
  );
  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const canUpdate = role !== "requester";
  const canAssign = role === "manager" || role === "admin";

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }
  function navigate(next: View) {
    setView(next);
    setSelectedId(null);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function displayTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString("vi-VN", {
          dateStyle: "short",
          timeStyle: "short",
        });
  }
  function displaySize(bytes: number) {
    return bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  async function loadTicketDetails(id: string, scroll = false) {
    const response = await fetch(`/api/tickets/${id}`);
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      notify(data.error ?? "Không thể tải ticket.");
      return;
    }
    const detail = data.ticket as Ticket & {
      comments: (Comment & { time: string })[];
      activities: (Activity & { time: string })[];
      attachments: (Omit<Attachment, "size"> & {
        sizeBytes: number;
        time: string;
      })[];
    };
    setTickets((old) =>
      old.map((ticket) =>
        ticket.id === id ? { ...ticket, ...detail } : ticket,
      ),
    );
    setComments((old) => ({
      ...old,
      [id]: detail.comments.map((item) => ({
        ...item,
        time: displayTime(item.time),
      })),
    }));
    setActivities((old) => ({
      ...old,
      [id]: detail.activities.map((item) => ({
        ...item,
        time: displayTime(item.time),
      })),
    }));
    setAttachments((old) => ({
      ...old,
      [id]: detail.attachments.map((item) => ({
        ...item,
        size: displaySize(item.sizeBytes),
        time: displayTime(item.time),
      })),
    }));
    setSelectedId(id);
    setMobileNav(false);
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openTicket(id: string) {
    void loadTicketDetails(id, true);
  }
  function logActivity(id: string, text: string) {
    setActivities((old) => ({
      ...old,
      [id]: [
        {
          id: Date.now(),
          text,
          actor: role === "requester" ? "Thu Hà" : "Hoàng Anh",
          time: "Vừa xong",
        },
        ...(old[id] ?? []),
      ],
    }));
  }
  async function moveTicket(id: string, status: Status) {
    if (!canUpdate)
      return notify("Requester không có quyền đổi trạng thái ticket");
    setTickets((old) =>
      old.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              status,
              resolutionSla:
                status === "resolved" ? 0 : Math.max(ticket.resolutionSla, 30),
            }
          : ticket,
      ),
    );
    logActivity(id, `Đã chuyển trạng thái sang ${statusLabels[status]}`);
    const apiStatus = {
      new: "NEW",
      progress: "IN_PROGRESS",
      waiting: "WAITING",
      resolved: "RESOLVED",
    }[status];
    const response = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: apiStatus }),
    });
    const data = await response.json();
    if (!response.ok) {
      notify(data.error ?? "Không thể đổi trạng thái.");
      await loadTicketDetails(id);
      return;
    }
    setTickets((old) =>
      old.map((ticket) =>
        ticket.id === id ? { ...ticket, ...data.ticket } : ticket,
      ),
    );
    await loadTicketDetails(id);
    notify(`Đã chuyển #${id} sang ${statusLabels[status]}`);
  }
  async function assignTicket(id: string, assignee: string) {
    if (!canAssign) return notify("Chỉ Manager và Admin có quyền phân công");
    const initials =
      assignee === "Minh Tuấn"
        ? "MT"
        : assignee === "Ngọc Lan"
          ? "NL"
          : assignee === "Quốc Duy"
            ? "QD"
            : "--";
    setTickets((old) =>
      old.map((ticket) =>
        ticket.id === id ? { ...ticket, assignee, initials } : ticket,
      ),
    );
    const assigneeId =
      assignee === "Chưa phân công"
        ? null
        : agents.find((agent) => agent.name === assignee)?.id;
    if (assignee !== "Chưa phân công" && !assigneeId)
      return notify("Không tìm thấy người xử lý.");
    const response = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId }),
    });
    const data = await response.json();
    if (!response.ok) {
      notify(data.error ?? "Không thể phân công.");
      await loadTicketDetails(id);
      return;
    }
    logActivity(id, `Đã phân công cho ${assignee}`);
    await loadTicketDetails(id);
    notify("Đã cập nhật người xử lý");
  }
  async function addComment(id: string, body: string, internal: boolean) {
    if (!body.trim()) return;
    if (internal && role === "requester")
      return notify("Requester không thể tạo ghi chú nội bộ");
    const response = await fetch(`/api/tickets/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, internal }),
    });
    const data = await response.json();
    if (!response.ok) return notify(data.error ?? "Không thể gửi bình luận.");
    await loadTicketDetails(id);
    notify("Đã gửi bình luận");
  }
  async function addAttachment(id: string, file: File) {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch(`/api/tickets/${id}/attachments`, {
      method: "POST",
      body: form,
    });
    const data = await response.json();
    if (!response.ok) return notify(data.error ?? "Không thể tải file lên.");
    await loadTicketDetails(id);
    notify("Đã thêm file đính kèm");
  }
  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const assignee = String(form.get("assignee"));
    const priority = { low: "LOW", medium: "MEDIUM", high: "HIGH" }[
      form.get("priority") as Priority
    ];
    const assigneeId =
      agents.find((agent) => agent.name === assignee)?.id ?? null;
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description") || "Chưa có mô tả chi tiết.",
        category: form.get("category"),
        priority,
        assigneeId,
      }),
    });
    const data = await response.json();
    if (!response.ok) return notify(data.error ?? "Không thể tạo ticket.");
    setTickets((old) => [data.ticket, ...old]);
    setModal(false);
    event.currentTarget.reset();
    notify(`Đã tạo ticket #${data.ticket.id}`);
    openTicket(data.ticket.id);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (authLoading)
    return (
      <main className="app-loading">
        <div className="brand">
          <span>F</span> Flowdesk
        </div>
        <p>Đang kết nối hệ thống local...</p>
      </main>
    );
  if (bootstrapError)
    return (
      <main className="app-loading local-error">
        <div className="brand">
          <span>F</span> Flowdesk
        </div>
        <h1>Chưa kết nối được PostgreSQL</h1>
        <p>{bootstrapError}</p>
        <code>docker compose up -d</code>
        <button onClick={() => window.location.reload()} className="primary">
          Thử lại
        </button>
      </main>
    );

  return (
    <main className="app-shell">
      {mobileNav && (
        <button
          className="nav-backdrop"
          aria-label="Đóng menu"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <span>F</span> Flowdesk
        </div>
        <div className="workspace">
          <b>N</b>
          <div>
            NovaTech Việt Nam<small>Internal IT Workspace</small>
          </div>
        </div>
        <p className="nav-label">Workspace</p>
        <nav>
          {(
            [
              ["dashboard", "▦", "Tổng quan"],
              ["kanban", "▥", "Bảng công việc"],
              ["tickets", "≡", "Tất cả ticket"],
              ["portal", "⌂", "Cổng nhân viên"],
            ] as [View, string, string][]
          ).map(([key, icon, label]) => (
            <button
              key={key}
              className={!selected && view === key ? "active" : ""}
              onClick={() => navigate(key)}
            >
              <i>{icon}</i>
              <span>{label}</span>
              {key === "kanban" && <b>{openCount}</b>}
            </button>
          ))}
        </nav>
        <p className="nav-label">Quản lý</p>
        <nav>
          <button disabled={role === "requester"}>
            <i>◷</i>
            <span>SLA & tự động hóa</span>
          </button>
          <button disabled={role === "requester"}>
            <i>▱</i>
            <span>Báo cáo</span>
          </button>
          <button
            disabled={role !== "admin"}
            className={!selected && view === "users" ? "active" : ""}
            onClick={() => navigate("users")}
          >
            <i>⚙</i>
            <span>Tài khoản & phân quyền</span>
          </button>
        </nav>
        <div className="profile">
          <Avatar initials={role === "requester" ? "TH" : "HA"} />
          <div>
            {currentName}
            <small>{roleLabels[role]}</small>
          </div>
        </div>
      </aside>
      <section className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNav(true)}
            aria-label="Mở menu"
          >
            ☰
          </button>
          <span>
            Helpdesk / <b>{selected ? selected.id : viewLabels[view]}</b>
          </span>
          <div />
          <label className="global-search">
            ⌕{" "}
            <input
              placeholder="Tìm ticket, nhân viên..."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setQuery(event.currentTarget.value);
                  navigate("tickets");
                }
              }}
            />
          </label>
          <div className="role-switch">
            <span>Vai trò</span>
            <b>{roleLabels[role]}</b>
          </div>
          <button className="bell" aria-label="Thông báo">
            ♢<i />
          </button>
          <button
            className="secondary password-button"
            onClick={() => setPasswordModal(true)}
          >
            Đổi mật khẩu
          </button>
          <button
            className="secondary logout-button"
            onClick={() => void logout()}
          >
            Đăng xuất
          </button>
          <button className="primary" onClick={() => setModal(true)}>
            ＋ Tạo ticket
          </button>
        </header>
        <div className="page">
          {selected ? (
            <TicketDetail
              ticket={selected}
              comments={comments[selected.id] ?? []}
              activities={activities[selected.id] ?? []}
              attachments={attachments[selected.id] ?? []}
              role={role}
              canUpdate={canUpdate}
              canAssign={canAssign}
              agents={agents}
              onBack={() => setSelectedId(null)}
              onMove={(status) => moveTicket(selected.id, status)}
              onAssign={(assignee) => assignTicket(selected.id, assignee)}
              onComment={(body, internal) =>
                addComment(selected.id, body, internal)
              }
              onAttachment={(file) => addAttachment(selected.id, file)}
            />
          ) : (
            <>
              {view === "dashboard" && (
                <Dashboard
                  openCount={openCount}
                  resolvedCount={resolvedCount}
                  tickets={visibleTickets}
                  onCreate={() => setModal(true)}
                  onOpen={openTicket}
                  onViewTickets={() => navigate("tickets")}
                />
              )}
              {view === "kanban" && (
                <Kanban
                  tickets={visibleTickets}
                  dragId={dragId}
                  setDragId={setDragId}
                  moveTicket={moveTicket}
                  onOpen={openTicket}
                  onCreate={() => setModal(true)}
                />
              )}
              {view === "tickets" && (
                <TicketTable
                  tickets={filtered}
                  query={query}
                  setQuery={setQuery}
                  filter={statusFilter}
                  setFilter={setStatusFilter}
                  onOpen={openTicket}
                  onCreate={() => setModal(true)}
                />
              )}
              {view === "portal" && (
                <Portal
                  onCreate={() => setModal(true)}
                  onOpen={() => openTicket("HD-1031")}
                />
              )}
              {view === "users" && role === "admin" && (
                <AdminUsers notify={notify} />
              )}
            </>
          )}
        </div>
      </section>
      {modal && (
        <TicketModal
          role={role}
          agents={agents}
          onClose={() => setModal(false)}
          onSubmit={createTicket}
        />
      )}
      {passwordModal && (
        <PasswordModal
          required={passwordRequired}
          onClose={() => setPasswordModal(false)}
          onSaved={() => {
            setPasswordRequired(false);
            setPasswordModal(false);
            notify("Đã đổi mật khẩu và làm mới phiên đăng nhập");
          }}
        />
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function Dashboard({
  openCount,
  resolvedCount,
  tickets,
  onCreate,
  onOpen,
  onViewTickets,
}: {
  openCount: number;
  resolvedCount: number;
  tickets: Ticket[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onViewTickets: () => void;
}) {
  const kpis = [
    {
      label: "Ticket đang mở",
      value: openCount,
      note: "+2 so với hôm qua",
      tone: "danger",
      icon: "◎",
    },
    {
      label: "Sắp vi phạm SLA",
      value: 2,
      note: "Cần xử lý ngay",
      tone: "danger",
      icon: "◷",
    },
    {
      label: "Đã giải quyết",
      value: resolvedCount,
      note: "+12% trong tuần",
      tone: "good",
      icon: "✓",
    },
    {
      label: "CSAT trung bình",
      value: "4.8",
      note: "96% hài lòng",
      tone: "good",
      icon: "☆",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="THỨ TƯ, 20 THÁNG 8"
        title="Chào buổi sáng, Hoàng Anh"
        description="Đây là tình hình vận hành Helpdesk hôm nay."
      >
        <button className="primary" onClick={onCreate}>
          ＋ Tạo ticket
        </button>
      </PageHeading>
      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <article className="kpi" key={kpi.label}>
            <div>
              <span>{kpi.label}</span>
              <b>{kpi.icon}</b>
            </div>
            <strong>{kpi.value}</strong>
            <small className={kpi.tone}>{kpi.note}</small>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel performance">
          <div className="panel-head">
            <div>
              <p className="eyebrow">HIỆU SUẤT</p>
              <h2>Xu hướng xử lý ticket</h2>
            </div>
            <button>7 ngày gần nhất⌄</button>
          </div>
          <div className="chart">
            {[45, 62, 54, 78, 70, 48, 36].map((height, index) => (
              <span style={{ height: `${height}%` }} key={index} />
            ))}
          </div>
          <div className="days">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </article>
        <article className="panel queue">
          <div className="panel-head">
            <div>
              <p className="eyebrow">ƯU TIÊN HÔM NAY</p>
              <h2>Ticket cần chú ý</h2>
            </div>
            <button onClick={onViewTickets}>→</button>
          </div>
          {tickets.slice(0, 3).map((ticket, index) => (
            <button
              className="queue-row"
              key={ticket.id}
              onClick={() => onOpen(ticket.id)}
            >
              <i className={`level l${index}`} />
              <div>
                <b>{ticket.title}</b>
                <small>
                  #{ticket.id} · {ticket.requester}
                </small>
              </div>
              <Sla
                minutes={ticket.resolutionSla}
                complete={ticket.status === "resolved"}
              />
            </button>
          ))}
        </article>
      </section>
    </>
  );
}

function Kanban({
  tickets,
  dragId,
  setDragId,
  moveTicket,
  onOpen,
  onCreate,
}: {
  tickets: Ticket[];
  dragId: string | null;
  setDragId: (id: string | null) => void;
  moveTicket: (id: string, status: Status) => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="HELPDESK TEAM"
        title="Bảng công việc"
        description="Kéo thả ticket trên desktop hoặc chọn trạng thái trên điện thoại."
      >
        <button className="primary" onClick={onCreate}>
          ＋ Tạo ticket
        </button>
      </PageHeading>
      <div className="board-toolbar">
        <button>☷ Bộ lọc</button>
        <button>Người xử lý: Tất cả⌄</button>
        <button>Ưu tiên: Tất cả⌄</button>
      </div>
      <section className="board">
        {columns.map((column) => {
          const list = tickets.filter((ticket) => ticket.status === column.key);
          return (
            <div
              className="column"
              key={column.key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dragId && moveTicket(dragId, column.key)}
            >
              <header>
                <i className={`dot-${column.dot}`} />
                <b>{column.label}</b>
                <span>{list.length}</span>
              </header>
              <div className="ticket-stack">
                {list.map((ticket) => (
                  <article
                    className="ticket-card"
                    key={ticket.id}
                    draggable
                    onDragStart={() => setDragId(ticket.id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <button
                      className="card-open"
                      onClick={() => onOpen(ticket.id)}
                      aria-label={`Mở ${ticket.id}`}
                    >
                      <div className="ticket-code">
                        <span>#{ticket.id}</span>
                        <span>•••</span>
                      </div>
                      <h3>{ticket.title}</h3>
                      <div className="tag-row">
                        <PriorityBadge priority={ticket.priority} />
                        <span>{ticket.category}</span>
                        <span>{ticket.department}</span>
                      </div>
                      <footer>
                        <div>
                          <Avatar initials={ticket.initials} />
                          <small>{ticket.assignee}</small>
                        </div>
                        <Sla
                          minutes={ticket.resolutionSla}
                          complete={ticket.status === "resolved"}
                        />
                      </footer>
                    </button>
                    <label className="mobile-status">
                      Trạng thái
                      <select
                        value={ticket.status}
                        onChange={(event) =>
                          moveTicket(ticket.id, event.target.value as Status)
                        }
                      >
                        {columns.map((item) => (
                          <option value={item.key} key={item.key}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

function TicketTable({
  tickets,
  query,
  setQuery,
  filter,
  setFilter,
  onOpen,
  onCreate,
}: {
  tickets: Ticket[];
  query: string;
  setQuery: (value: string) => void;
  filter: Status | "all";
  setFilter: (value: Status | "all") => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="QUẢN LÝ YÊU CẦU"
        title="Tất cả ticket"
        description="Theo dõi, phân loại và xử lý yêu cầu trong một nơi."
      >
        <div className="heading-actions">
          <button className="secondary">↓ Xuất CSV</button>
          <button className="primary" onClick={onCreate}>
            ＋ Tạo ticket
          </button>
        </div>
      </PageHeading>
      <section className="table-panel">
        <div className="table-toolbar">
          <label>
            ⌕{" "}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm mã, tiêu đề, người yêu cầu..."
            />
          </label>
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as Status | "all")
            }
          >
            <option value="all">Tất cả trạng thái</option>
            {columns.map((column) => (
              <option value={column.key} key={column.key}>
                {column.label}
              </option>
            ))}
          </select>
          <button className="secondary">☷ Bộ lọc</button>
        </div>
        <div className="desktop-table">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tiêu đề</th>
                <th>Người yêu cầu</th>
                <th>Trạng thái</th>
                <th>Ưu tiên</th>
                <th>Người xử lý</th>
                <th>SLA giải quyết</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onOpen(ticket.id)}
                  tabIndex={0}
                  onKeyDown={(event) =>
                    event.key === "Enter" && onOpen(ticket.id)
                  }
                >
                  <td>
                    <b>#{ticket.id}</b>
                  </td>
                  <td className="title-cell">{ticket.title}</td>
                  <td>
                    {ticket.requester}
                    <small>{ticket.department}</small>
                  </td>
                  <td>
                    <span className={`status status-${ticket.status}`}>
                      {statusLabels[ticket.status]}
                    </span>
                  </td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                    {priorityLabels[ticket.priority]}
                  </td>
                  <td>{ticket.assignee}</td>
                  <td>
                    <Sla
                      minutes={ticket.resolutionSla}
                      complete={ticket.status === "resolved"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mobile-ticket-list">
          {tickets.map((ticket) => (
            <button onClick={() => onOpen(ticket.id)} key={ticket.id}>
              <article>
                <header>
                  <b>#{ticket.id}</b>
                  <span className={`status status-${ticket.status}`}>
                    {statusLabels[ticket.status]}
                  </span>
                </header>
                <h3>{ticket.title}</h3>
                <p>
                  {ticket.requester} · {ticket.department}
                </p>
                <footer>
                  <span>
                    <PriorityBadge priority={ticket.priority} />
                    {priorityLabels[ticket.priority]}
                  </span>
                  <Sla
                    minutes={ticket.resolutionSla}
                    complete={ticket.status === "resolved"}
                  />
                </footer>
              </article>
            </button>
          ))}
        </div>
        {tickets.length === 0 && (
          <div className="empty">Không tìm thấy ticket phù hợp.</div>
        )}
      </section>
    </>
  );
}

function TicketDetail({
  ticket,
  comments,
  activities,
  attachments,
  role,
  canUpdate,
  canAssign,
  agents,
  onBack,
  onMove,
  onAssign,
  onComment,
  onAttachment,
}: {
  ticket: Ticket;
  comments: Comment[];
  activities: Activity[];
  attachments: Attachment[];
  role: Role;
  canUpdate: boolean;
  canAssign: boolean;
  agents: AgentOption[];
  onBack: () => void;
  onMove: (status: Status) => void;
  onAssign: (assignee: string) => void;
  onComment: (body: string, internal: boolean) => void;
  onAttachment: (file: File) => void;
}) {
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);
  const visibleComments = comments.filter(
    (item) => !item.internal || role !== "requester",
  );
  return (
    <div className="ticket-detail">
      <button className="back-link" onClick={onBack}>
        ← Quay lại danh sách
      </button>
      <header className="detail-header">
        <div>
          <div className="detail-meta">
            <span>#{ticket.id}</span>
            <span className={`status status-${ticket.status}`}>
              {statusLabels[ticket.status]}
            </span>
            <span className="permission-chip">Quyền: {roleLabels[role]}</span>
          </div>
          <h1>{ticket.title}</h1>
          <p>
            Được gửi bởi <b>{ticket.requester}</b> · {ticket.department} · Hôm
            nay, 08:37
          </p>
        </div>
        <div className="detail-actions">
          <select
            aria-label="Trạng thái"
            value={ticket.status}
            disabled={!canUpdate}
            onChange={(event) => onMove(event.target.value as Status)}
          >
            {columns.map((column) => (
              <option value={column.key} key={column.key}>
                {column.label}
              </option>
            ))}
          </select>
          <button
            className="primary"
            disabled={!canUpdate}
            onClick={() => onMove("resolved")}
          >
            ✓ Giải quyết
          </button>
        </div>
      </header>
      <section className="sla-strip">
        <article>
          <div>
            <span>SLA phản hồi</span>
            <small>
              {ticket.responseSla === 0
                ? "Đã phản hồi lúc 09:03"
                : "Còn lại trước 09:37"}
            </small>
          </div>
          <Sla
            minutes={ticket.responseSla}
            complete={ticket.responseSla === 0}
          />
        </article>
        <article>
          <div>
            <span>SLA giải quyết</span>
            <small>
              Mục tiêu theo ưu tiên {priorityLabels[ticket.priority]}
            </small>
          </div>
          <Sla
            minutes={ticket.resolutionSla}
            complete={ticket.status === "resolved"}
          />
        </article>
      </section>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="detail-panel description-card">
            <p className="eyebrow">MÔ TẢ YÊU CẦU</p>
            <p>{ticket.description}</p>
            <div className="detail-tags">
              <span>{ticket.category}</span>
              <span>{ticket.department}</span>
              <span>
                <PriorityBadge priority={ticket.priority} /> Ưu tiên{" "}
                {priorityLabels[ticket.priority]}
              </span>
            </div>
          </section>
          <section className="detail-panel conversation">
            <div className="section-title">
              <div>
                <p className="eyebrow">TRAO ĐỔI</p>
                <h2>Bình luận</h2>
              </div>
              <span>{visibleComments.length}</span>
            </div>
            <div className="comment-list">
              {visibleComments.map((item) => (
                <article
                  className={item.internal ? "internal" : ""}
                  key={item.id}
                >
                  <Avatar initials={item.initials} />
                  <div>
                    <header>
                      <b>{item.author}</b>
                      <span>{item.time}</span>
                      {item.internal && <em>Ghi chú nội bộ</em>}
                    </header>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
              {visibleComments.length === 0 && (
                <p className="empty-inline">Chưa có bình luận.</p>
              )}
            </div>
            <form
              className="comment-box"
              onSubmit={(event) => {
                event.preventDefault();
                onComment(comment, internal);
                setComment("");
              }}
            >
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Nhập phản hồi cho người yêu cầu..."
                aria-label="Nội dung bình luận"
              />
              <footer>
                {role !== "requester" && (
                  <label>
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(event) => setInternal(event.target.checked)}
                    />{" "}
                    Ghi chú nội bộ
                  </label>
                )}
                <button className="primary" disabled={!comment.trim()}>
                  Gửi bình luận
                </button>
              </footer>
            </form>
          </section>
          <section className="detail-panel activity-panel">
            <div className="section-title">
              <div>
                <p className="eyebrow">NHẬT KÝ</p>
                <h2>Lịch sử hoạt động</h2>
              </div>
            </div>
            <div className="timeline">
              {activities.map((item) => (
                <article key={item.id}>
                  <i />
                  <div>
                    <p>{item.text}</p>
                    <small>
                      {item.actor} · {item.time}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="detail-side">
          <section className="detail-panel properties">
            <p className="eyebrow">THUỘC TÍNH</p>
            <label>
              Người xử lý
              <select
                value={ticket.assignee}
                disabled={!canAssign}
                onChange={(event) => onAssign(event.target.value)}
              >
                <option>Chưa phân công</option>
                {agents.map((agent) => (
                  <option key={agent.id}>{agent.name}</option>
                ))}
              </select>
            </label>
            <dl>
              <div>
                <dt>Người yêu cầu</dt>
                <dd>{ticket.requester}</dd>
              </div>
              <div>
                <dt>Danh mục</dt>
                <dd>{ticket.category}</dd>
              </div>
              <div>
                <dt>Ưu tiên</dt>
                <dd>
                  <PriorityBadge priority={ticket.priority} />{" "}
                  {priorityLabels[ticket.priority]}
                </dd>
              </div>
              <div>
                <dt>Vai trò hiện tại</dt>
                <dd>{roleLabels[role]}</dd>
              </div>
            </dl>
            {!canAssign && (
              <small className="permission-note">
                Chỉ Manager và Admin có thể phân công ticket.
              </small>
            )}
          </section>
          <section className="detail-panel attachments">
            <div className="section-title">
              <div>
                <p className="eyebrow">TỆP</p>
                <h2>Đính kèm</h2>
              </div>
              <label className="upload-button">
                ＋ Thêm
                <input
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onAttachment(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            {attachments.map((file) => (
              <article key={file.id}>
                <i>▧</i>
                <div>
                  {file.downloadUrl ? (
                    <a href={file.downloadUrl}>
                      <b>{file.name}</b>
                    </a>
                  ) : (
                    <b>{file.name}</b>
                  )}
                  <small>
                    {file.size} · {file.author} · {file.time}
                  </small>
                </div>
              </article>
            ))}
            {attachments.length === 0 && (
              <p className="empty-inline">Chưa có file đính kèm.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Portal({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: () => void;
}) {
  const categories = [
    {
      icon: "▣",
      title: "Thiết bị & phần cứng",
      text: "Laptop, màn hình, máy in và phụ kiện",
    },
    {
      icon: "♙",
      title: "Tài khoản & truy cập",
      text: "Mật khẩu, phân quyền, email công ty",
    },
    {
      icon: "⌁",
      title: "Mạng & kết nối",
      text: "Wi-Fi, VPN và kết nối nội bộ",
    },
    {
      icon: "◇",
      title: "Phần mềm & ứng dụng",
      text: "Cài đặt, cập nhật và lỗi ứng dụng",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="REQUESTER EXPERIENCE"
        title="Cổng nhân viên"
        description="Giao diện tự phục vụ dành cho toàn thể nhân viên."
      />
      <section className="portal">
        <header>
          <div className="portal-brand">
            <b>N</b> NovaTech Help Center
          </div>
          <nav>Trang chủ · Yêu cầu của tôi · Kho kiến thức</nav>
          <Avatar initials="TH" />
        </header>
        <div className="portal-hero">
          <span>TRUNG TÂM HỖ TRỢ NỘI BỘ</span>
          <h2>Xin chào, Thu Hà 👋</h2>
          <p>Hôm nay chúng tôi có thể giúp gì cho bạn?</p>
          <label>
            ⌕ <input placeholder="Tìm hướng dẫn hoặc mô tả vấn đề..." />
            <button>Tìm kiếm</button>
          </label>
        </div>
        <div className="portal-body">
          <h3>Gửi yêu cầu nhanh</h3>
          <div className="category-grid">
            {categories.map((category) => (
              <button onClick={onCreate} key={category.title}>
                <i>{category.icon}</i>
                <b>{category.title}</b>
                <span>{category.text}</span>
              </button>
            ))}
          </div>
          <section className="recent">
            <header>
              <h3>Yêu cầu gần đây của bạn</h3>
              <button>Xem tất cả →</button>
            </header>
            <button className="recent-ticket" onClick={onOpen}>
              <PriorityBadge priority="high" />
              <p>
                <b>Không thể kết nối VPN khi làm việc tại nhà</b>
                <small>#HD-1031 · Cập nhật 24 phút trước</small>
              </p>
              <span className="status status-waiting">Chờ phản hồi</span>
            </button>
          </section>
        </div>
      </section>
    </>
  );
}

function TicketModal({
  role,
  agents,
  onClose,
  onSubmit,
}: {
  role: Role;
  agents: AgentOption[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={onSubmit}>
        <header>
          <div>
            <p className="eyebrow">YÊU CẦU HỖ TRỢ</p>
            <h2>Tạo ticket mới</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </header>
        <div className="modal-body">
          <label className="field">
            <span>Tiêu đề yêu cầu *</span>
            <input
              name="title"
              required
              placeholder="Ví dụ: Không kết nối được Wi-Fi tầng 3"
            />
          </label>
          <label className="field">
            <span>Mô tả chi tiết</span>
            <textarea
              name="description"
              placeholder="Mô tả sự cố, thời điểm xảy ra và ảnh hưởng..."
            />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>Người yêu cầu</span>
              <input
                name="requester"
                defaultValue={role === "requester" ? "Thu Hà" : "Thanh Vân"}
              />
            </label>
            <label className="field">
              <span>Phòng ban</span>
              <input
                name="department"
                defaultValue={role === "requester" ? "Nhân sự" : "Kế toán"}
              />
            </label>
          </div>
          <div className="field-grid">
            <label className="field">
              <span>Danh mục</span>
              <select name="category">
                <option>Phần cứng</option>
                <option>Tài khoản</option>
                <option>Mạng & Wi-Fi</option>
                <option>Phần mềm</option>
                <option>Yêu cầu khác</option>
              </select>
            </label>
            <label className="field">
              <span>Mức độ ưu tiên</span>
              <select name="priority" defaultValue="medium">
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Giao cho</span>
            <select
              name="assignee"
              disabled={role === "requester" || role === "agent"}
            >
              <option>Chưa phân công</option>
              {agents.map((agent) => (
                <option key={agent.id}>{agent.name}</option>
              ))}
            </select>
          </label>
        </div>
        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="primary">Tạo ticket</button>
        </footer>
      </form>
    </div>
  );
}
