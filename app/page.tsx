"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TicketTrendChart, type TrendPoint } from "@/components/TicketTrendChart";
import { AppShell } from "@/components/AppShell";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";
import { AdminSlaPolicies } from "@/components/admin/AdminSlaPolicies";
import { AdminTickets } from "@/components/admin/AdminTickets";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { PasswordModal } from "@/components/PasswordModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialsOf } from "@/domain/user/user";

type Status = "new" | "progress" | "waiting" | "resolved";
type Priority = "high" | "medium" | "low";
type View =
  | "dashboard"
  | "kanban"
  | "tickets"
  | "portal"
  | "admin-tickets"
  | "sla"
  | "audit"
  | "users";
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
  createdAt?: string;
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
  "admin-tickets": "Toàn bộ ticket",
  sla: "Chính sách SLA",
  users: "Quản lý tài khoản",
  audit: "Nhật ký hoạt động",
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
  // Agents and above see the system-wide queue; requesters never do.
  const isStaff = role !== "requester";

  function notify(message: string) {
    toast.success(message);
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
  async function loadTicketDetails(
    id: string,
    { select = false, scroll = false }: { select?: boolean; scroll?: boolean } = {},
  ) {
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
    if (select) {
      setSelectedId(id);
      setMobileNav(false);
    }
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openTicket(id: string) {
    void loadTicketDetails(id, { select: true, scroll: true });
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

  const navGroups = [
    {
      label: "Workspace",
      items: (
        [
          ["dashboard", "▦", "Tổng quan"],
          ["kanban", "▥", "Bảng công việc"],
          ["tickets", "≡", "Tất cả ticket"],
          ["portal", "⌂", "Cổng nhân viên"],
        ] as [View, string, string][]
      ).map(([key, icon, label]) => ({
        key,
        icon,
        label,
        badge: key === "kanban" ? openCount : undefined,
        active: !selected && view === key,
        onSelect: () => navigate(key),
      })),
    },
    {
      label: "Vận hành",
      items: [
        {
          key: "admin-tickets",
          icon: "▤",
          label: "Toàn bộ ticket",
          disabled: !isStaff,
          active: !selected && view === "admin-tickets",
          onSelect: () => navigate("admin-tickets"),
        },
        {
          key: "reports",
          icon: "▱",
          label: "Báo cáo",
          disabled: true,
        },
      ],
    },
    {
      label: "Quản trị",
      items: [
        {
          key: "sla",
          icon: "◷",
          label: "Chính sách SLA",
          disabled: role !== "admin",
          active: !selected && view === "sla",
          onSelect: () => navigate("sla"),
        },
        {
          key: "users",
          icon: "⚙",
          label: "Tài khoản & phân quyền",
          disabled: role !== "admin",
          active: !selected && view === "users",
          onSelect: () => navigate("users"),
        },
        {
          key: "audit",
          icon: "◫",
          label: "Nhật ký hoạt động",
          disabled: role !== "admin",
          active: !selected && view === "audit",
          onSelect: () => navigate("audit"),
        },
      ],
    },
  ];

  return (
    <AppShell
      groups={navGroups}
      workspaceName="Bravestars"
      workspaceHint="Internal IT Workspace"
      breadcrumb={
        <>
          Helpdesk /{" "}
          <b className="text-foreground">
            {selected ? selected.id : viewLabels[view]}
          </b>
        </>
      }
      userName={currentName}
      userRole={roleLabels[role]}
      userInitials={role === "requester" ? "TH" : "HA"}
      mobileNavOpen={mobileNav}
      onMobileNavChange={setMobileNav}
      onSearch={(term) => {
        setQuery(term);
        navigate("tickets");
      }}
      onChangePassword={() => setPasswordModal(true)}
      onLogout={() => void logout()}
      actions={
        <Button type="button" size="sm" onClick={() => setModal(true)}>
          ＋ Tạo ticket
        </Button>
      }
    >
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
                  currentName={currentName}
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
                  currentName={currentName}
                  onCreate={() => setModal(true)}
                  onOpen={() => openTicket("HD-1031")}
                />
              )}
              {view === "admin-tickets" && isStaff && (
                <AdminTickets onOpen={openTicket} />
              )}
              {view === "sla" && role === "admin" && (
                <AdminSlaPolicies notify={notify} />
              )}
              {view === "users" && role === "admin" && (
                <AdminUsers notify={notify} />
              )}
              {view === "audit" && role === "admin" && <AdminAuditLog />}
            </>
          )}
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
    </AppShell>
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

const WEEKDAYS_VI = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

function Dashboard({
  currentName,
  openCount,
  resolvedCount,
  tickets,
  onCreate,
  onOpen,
  onViewTickets,
}: {
  currentName: string;
  openCount: number;
  resolvedCount: number;
  tickets: Ticket[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onViewTickets: () => void;
}) {
  const now = new Date();
  const eyebrow =
    `${WEEKDAYS_VI[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}`.toUpperCase();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  // Same breach convention as AdminTickets: an open ticket with 0 minutes left
  // has already missed its resolution SLA; <=60 minutes is the warning band.
  const nearBreachCount = tickets.filter(
    (ticket) =>
      ticket.status !== "resolved" &&
      ticket.resolutionSla > 0 &&
      ticket.resolutionSla <= 60,
  ).length;
  const breachedCount = tickets.filter(
    (ticket) => ticket.status !== "resolved" && ticket.resolutionSla === 0,
  ).length;
  const highPriorityOpenCount = tickets.filter(
    (ticket) => ticket.status !== "resolved" && ticket.priority === "high",
  ).length;
  const resolvedRate = tickets.length
    ? Math.round((resolvedCount / tickets.length) * 100)
    : 0;

  // Derived from the real ticket list: bucket by weekday of creation, so the
  // chart moves with the data instead of showing fixed decorative bars.
  const trend: TrendPoint[] = useMemo(() => {
    const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const buckets = labels.map((day) => ({ day, created: 0, resolved: 0 }));
    for (const ticket of tickets) {
      if (!ticket.createdAt) continue;
      const bucket = buckets[new Date(ticket.createdAt).getDay()];
      if (!bucket) continue;
      bucket.created += 1;
      if (ticket.status === "resolved") bucket.resolved += 1;
    }
    // Monday-first reads better than Sunday-first for a work queue.
    return [...buckets.slice(1), buckets[0]];
  }, [tickets]);

  const kpis = [
    {
      label: "Ticket đang mở",
      value: openCount,
      note:
        highPriorityOpenCount > 0
          ? `${highPriorityOpenCount} ưu tiên cao`
          : "Không có ticket ưu tiên cao",
      tone: "danger",
      icon: "◎",
    },
    {
      label: "Sắp vi phạm SLA",
      value: nearBreachCount,
      note: "Cần xử lý ngay",
      tone: "danger",
      icon: "◷",
    },
    {
      label: "Đã giải quyết",
      value: resolvedCount,
      note: `${resolvedRate}% tổng số ticket hiển thị`,
      tone: "good",
      icon: "✓",
    },
    {
      label: "Trễ hạn SLA",
      value: breachedCount,
      note: "Đã quá hạn giải quyết",
      tone: breachedCount > 0 ? "danger" : "good",
      icon: "⚠",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow={eyebrow}
        title={`${greeting}, ${currentName}`}
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
          <TicketTrendChart data={trend} />
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
  // Collapsed by default on nothing — lets a column be tucked away on a small
  // screen so the board doesn't turn into one long scroll through every status.
  const [collapsedColumns, setCollapsedColumns] = useState<
    Record<string, boolean>
  >({});
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
              <button
                type="button"
                className="column-toggle"
                aria-expanded={!collapsedColumns[column.key]}
                onClick={() =>
                  setCollapsedColumns((prev) => ({
                    ...prev,
                    [column.key]: !prev[column.key],
                  }))
                }
              >
                <i className={`dot-${column.dot}`} />
                <b>{column.label}</b>
                <span className="column-count">{list.length}</span>
                <span className="column-chevron" aria-hidden>
                  ⌄
                </span>
              </button>
              {!collapsedColumns[column.key] && (
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
              )}
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
  currentName,
  onCreate,
  onOpen,
}: {
  currentName: string;
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
            <b>B</b> Bravestars Help Center
          </div>
          <nav>Trang chủ · Yêu cầu của tôi · Kho kiến thức</nav>
          <Avatar initials={initialsOf(currentName)} />
        </header>
        <div className="portal-hero">
          <span>TRUNG TÂM HỖ TRỢ NỘI BỘ</span>
          <h2>Xin chào, {currentName} 👋</h2>
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
  const categories = [
    "Phần cứng",
    "Tài khoản",
    "Mạng & Wi-Fi",
    "Phần mềm",
    "Yêu cầu khác",
  ];
  const priorities = [
    { value: "high", label: "Cao" },
    { value: "medium", label: "Trung bình" },
    { value: "low", label: "Thấp" },
  ];
  const assignees = ["Chưa phân công", ...agents.map((agent) => agent.name)];
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              YÊU CẦU HỖ TRỢ
            </p>
            <DialogTitle>Tạo ticket mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="ticket-title">Tiêu đề yêu cầu *</Label>
            <Input
              id="ticket-title"
              name="title"
              required
              placeholder="Ví dụ: Không kết nối được Wi-Fi tầng 3"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ticket-description">Mô tả chi tiết</Label>
            <Textarea
              id="ticket-description"
              name="description"
              placeholder="Mô tả sự cố, thời điểm xảy ra và ảnh hưởng..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ticket-requester">Người yêu cầu</Label>
              <Input
                id="ticket-requester"
                name="requester"
                defaultValue={role === "requester" ? "Thu Hà" : "Thanh Vân"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticket-department">Phòng ban</Label>
              <Input
                id="ticket-department"
                name="department"
                defaultValue={role === "requester" ? "Nhân sự" : "Kế toán"}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Danh mục</Label>
              <Select name="category" defaultValue={categories[0]}>
                <SelectTrigger className="w-full" aria-label="Danh mục">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Mức độ ưu tiên</Label>
              <Select name="priority" defaultValue="medium" items={priorities}>
                <SelectTrigger className="w-full" aria-label="Mức độ ưu tiên">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Giao cho</Label>
            <Select
              name="assignee"
              defaultValue={assignees[0]}
              disabled={role === "requester" || role === "agent"}
            >
              <SelectTrigger className="w-full" aria-label="Giao cho">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">Tạo ticket</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
