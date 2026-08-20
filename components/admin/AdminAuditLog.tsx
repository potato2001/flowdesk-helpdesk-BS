"use client";

import { useState } from "react";
import type { AuditLogDTO } from "@/application/dto/user.dto";
import { ApiError } from "@/client/api/http";
import { useAuditLogs } from "@/client/queries/admin.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export function AdminAuditLog() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string>(ANY);

  const query = {
    page,
    pageSize: 20,
    action: action === ANY ? undefined : action,
  };
  const auditQuery = useAuditLogs(query);

  // Includes the sentinel so the trigger shows a label, not "__any__".
  const actionItems = [
    { value: ANY, label: "Mọi hành động" },
    ...(auditQuery.data?.actions ?? []).map((name) => ({
      value: name,
      label: name.replaceAll("_", " "),
    })),
  ];

  const columns: Column<AuditLogDTO>[] = [
    {
      key: "action",
      header: "Hành động",
      cell: (log) => (
        <b className="font-medium">{log.action.replaceAll("_", " ")}</b>
      ),
    },
    {
      key: "actor",
      header: "Người thực hiện",
      cell: (log) =>
        log.actor ? (
          <>
            <span className="block">{log.actor.name}</span>
            <small className="text-muted-foreground">{log.actor.email}</small>
          </>
        ) : (
          "Hệ thống"
        ),
    },
    {
      key: "target",
      header: "Đối tượng",
      hideOnMobile: true,
      cell: (log) => (
        <code className="text-xs text-muted-foreground">
          {log.targetId ?? "—"}
        </code>
      ),
    },
    {
      key: "time",
      header: "Thời điểm",
      align: "end",
      cell: (log) => (
        <span className="text-sm text-muted-foreground">
          {formatTime(log.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeading
        eyebrow="BẢO MẬT"
        title="Nhật ký hoạt động"
        description="Toàn bộ sự kiện đăng nhập, thay đổi tài khoản và cấu hình hệ thống."
      />

      <Card>
        <CardHeader>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            AUDIT LOG
          </p>
          <CardTitle>
            {auditQuery.isPending
              ? "Đang tải..."
              : `${auditQuery.data?.meta.total ?? 0} bản ghi`}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Action names come from the server so the list reflects what has
              actually been recorded, not a hardcoded enum. */}
          <Select
            value={action}
            items={actionItems}
            onValueChange={(value) => {
              setPage(1);
              setAction(String(value));
            }}
          >
            <SelectTrigger size="sm" aria-label="Lọc theo hành động">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actionItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {auditQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
              {message(auditQuery.error, "Không thể tải nhật ký.")}
            </p>
          )}

          <DataTable
            rows={auditQuery.data?.logs ?? []}
            columns={columns}
            rowKey={(log) => log.id}
            meta={auditQuery.data?.meta}
            onPageChange={setPage}
            isLoading={auditQuery.isFetching}
            emptyMessage="Không có bản ghi nào khớp bộ lọc."
          />
        </CardContent>
      </Card>
    </>
  );
}
