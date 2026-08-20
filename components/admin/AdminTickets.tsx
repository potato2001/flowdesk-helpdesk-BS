"use client";

import { useMemo, useState } from "react";
import type { TicketDTO } from "@/application/dto/ticket.dto";
import { ApiError } from "@/client/api/http";
import { useTickets } from "@/client/queries/ticket.queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageHeading } from "./AdminPageHeading";
import { DataTable, type Column } from "./DataTable";

const ANY = "__any__";

const statusNames: Record<string, string> = {
  new: "Mới",
  progress: "Đang xử lý",
  waiting: "Chờ phản hồi",
  resolved: "Đã xong",
};
const priorityNames: Record<string, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

const statusItems = [
  { value: ANY, label: "Mọi trạng thái" },
  ...Object.entries(statusNames).map(([value, label]) => ({ value, label })),
];
const priorityItems = [
  { value: ANY, label: "Mọi mức ưu tiên" },
  ...Object.entries(priorityNames).map(([value, label]) => ({ value, label })),
];

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

/** SLA figures arrive as remaining minutes; zero means the clock has stopped. */
function slaBadge(minutes: number, done: boolean) {
  if (done) return <Badge variant="secondary">Hoàn tất</Badge>;
  if (minutes === 0) return <Badge variant="destructive">Trễ hạn</Badge>;
  if (minutes <= 60) return <Badge variant="destructive">{minutes} phút</Badge>;
  return <Badge variant="outline">{Math.round(minutes / 60)} giờ</Badge>;
}

export function AdminTickets({ onOpen }: { onOpen?: (ref: string) => void }) {
  const ticketsQuery = useTickets();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ANY);
  const [priority, setPriority] = useState<string>(ANY);
  const [breachedOnly, setBreachedOnly] = useState(false);

  // Filtering happens client-side: the list endpoint already returns every
  // ticket an admin may see, capped at 200.
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (ticketsQuery.data ?? []).filter((ticket) => {
      if (status !== ANY && ticket.status !== status) return false;
      if (priority !== ANY && ticket.priority !== priority) return false;
      if (
        breachedOnly &&
        !(ticket.status !== "resolved" && ticket.resolutionSla === 0)
      )
        return false;
      if (!term) return true;
      return `${ticket.id} ${ticket.title} ${ticket.requester} ${ticket.assignee}`
        .toLowerCase()
        .includes(term);
    });
  }, [ticketsQuery.data, search, status, priority, breachedOnly]);

  const columns: Column<TicketDTO>[] = [
    {
      key: "ticket",
      header: "Ticket",
      sortValue: (ticket) => ticket.title,
      cell: (ticket) => (
        <>
          <b className="block">{ticket.title}</b>
          <small className="text-muted-foreground">
            {ticket.id} · {ticket.category}
          </small>
        </>
      ),
    },
    {
      key: "requester",
      header: "Người yêu cầu",
      cell: (ticket) => (
        <>
          <span className="block">{ticket.requester}</span>
          <small className="text-muted-foreground">{ticket.department}</small>
        </>
      ),
    },
    {
      key: "assignee",
      header: "Người xử lý",
      hideOnMobile: true,
      cell: (ticket) => ticket.assignee,
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (ticket) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={ticket.status === "resolved" ? "secondary" : "outline"}>
            {statusNames[ticket.status] ?? ticket.status}
          </Badge>
          <small className="text-muted-foreground">
            {priorityNames[ticket.priority] ?? ticket.priority}
          </small>
        </div>
      ),
    },
    {
      key: "sla",
      header: "SLA giải quyết",
      sortValue: (ticket) => ticket.resolutionSla,
      cell: (ticket) =>
        slaBadge(ticket.resolutionSla, ticket.status === "resolved"),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "end",
      cell: (ticket) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpen?.(ticket.id)}
        >
          Mở
        </Button>
      ),
    },
  ];

  const breached = rows.filter(
    (ticket) => ticket.status !== "resolved" && ticket.resolutionSla === 0,
  ).length;

  return (
    <>
      <AdminPageHeading
        eyebrow="VẬN HÀNH"
        title="Toàn bộ ticket"
        description="Danh sách ticket trên toàn hệ thống, không giới hạn theo người xử lý."
      />

      <Card>
        <CardHeader>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            HÀNG ĐỢI
          </p>
          <CardTitle>
            {ticketsQuery.isPending
              ? "Đang tải..."
              : `${rows.length} ticket${breached ? ` · ${breached} trễ hạn` : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-60"
              placeholder="Tìm theo mã, tiêu đề, người dùng"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Tìm ticket"
            />
            <Select
              value={status}
              items={statusItems}
              onValueChange={(v) => setStatus(String(v))}
            >
              <SelectTrigger size="sm" aria-label="Lọc theo trạng thái">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priority}
              items={priorityItems}
              onValueChange={(v) => setPriority(String(v))}
            >
              <SelectTrigger size="sm" aria-label="Lọc theo ưu tiên">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={breachedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setBreachedOnly((old) => !old)}
            >
              Chỉ ticket trễ hạn
            </Button>
          </div>

          {ticketsQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
              {message(ticketsQuery.error, "Không thể tải danh sách ticket.")}
            </p>
          )}

          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(ticket) => ticket.id}
            isLoading={ticketsQuery.isFetching}
            emptyMessage="Không có ticket nào khớp bộ lọc."
          />
        </CardContent>
      </Card>
    </>
  );
}
