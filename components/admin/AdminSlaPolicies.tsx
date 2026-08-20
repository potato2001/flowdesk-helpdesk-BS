"use client";

import { FormEvent, useState } from "react";
import type { SlaPolicyDTO } from "@/application/dto/admin.dto";
import { ApiError } from "@/client/api/http";
import {
  useSlaPolicies,
  useUpdateSlaPolicy,
} from "@/client/queries/admin.queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageHeading } from "./AdminPageHeading";
import { DataTable, type Column } from "./DataTable";
import { FormDialog } from "./FormDialog";

const priorityNames: Record<string, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

/** Minutes read badly past an hour; show the unit an admin actually thinks in. */
function humanMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  const hours = minutes / 60;
  if (minutes % 60 === 0)
    return hours >= 24 && hours % 24 === 0
      ? `${hours / 24} ngày`
      : `${hours} giờ`;
  return `${Math.floor(hours)} giờ ${minutes % 60} phút`;
}

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function AdminSlaPolicies({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const policiesQuery = useSlaPolicies();
  const updatePolicy = useUpdateSlaPolicy();
  const [editing, setEditing] = useState<SlaPolicyDTO | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    updatePolicy.mutate(
      {
        priority: editing.priority,
        body: {
          name: String(form.get("name")),
          responseMinutes: Number(form.get("responseMinutes")),
          resolutionMinutes: Number(form.get("resolutionMinutes")),
          businessHoursOnly: form.get("businessHoursOnly") === "on",
          active: form.get("active") === "on",
        },
      },
      {
        onSuccess: (policy) => {
          setEditing(null);
          notify(`Đã cập nhật SLA ${priorityNames[policy.priority]}`);
        },
        onError: (error) =>
          setFormError(message(error, "Không thể cập nhật chính sách SLA.")),
      },
    );
  }

  const columns: Column<SlaPolicyDTO>[] = [
    {
      key: "priority",
      header: "Mức ưu tiên",
      cell: (policy) => (
        <>
          <b className="block">{priorityNames[policy.priority]}</b>
          <small className="text-muted-foreground">{policy.name}</small>
        </>
      ),
    },
    {
      key: "response",
      header: "Phản hồi",
      sortValue: (policy) => policy.responseMinutes,
      cell: (policy) => humanMinutes(policy.responseMinutes),
    },
    {
      key: "resolution",
      header: "Giải quyết",
      sortValue: (policy) => policy.resolutionMinutes,
      cell: (policy) => humanMinutes(policy.resolutionMinutes),
    },
    {
      key: "hours",
      header: "Giờ hành chính",
      cell: (policy) => (policy.businessHoursOnly ? "Có" : "24/7"),
    },
    {
      key: "active",
      header: "Trạng thái",
      cell: (policy) =>
        policy.active ? (
          <Badge variant="secondary">Đang áp dụng</Badge>
        ) : (
          <Badge variant="outline">Tạm tắt</Badge>
        ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "end",
      cell: (policy) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setFormError(null);
            setEditing(policy);
          }}
        >
          Chỉnh sửa
        </Button>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeading
        eyebrow="CẤU HÌNH DỊCH VỤ"
        title="Chính sách SLA"
        description="Thời hạn phản hồi và giải quyết áp dụng cho ticket mới theo từng mức ưu tiên."
      />

      <Card>
        <CardHeader>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            THEO MỨC ƯU TIÊN
          </p>
          <CardTitle>
            {policiesQuery.isPending
              ? "Đang tải..."
              : `${policiesQuery.data?.length ?? 0} chính sách`}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Thay đổi chỉ áp dụng cho ticket tạo sau đó — deadline của ticket cũ
            đã được ghi cố định lúc tạo.
          </p>
          {policiesQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
              {message(policiesQuery.error, "Không thể tải chính sách SLA.")}
            </p>
          )}
          <DataTable
            rows={policiesQuery.data ?? []}
            columns={columns}
            rowKey={(policy) => policy.id}
            isLoading={policiesQuery.isFetching}
            emptyMessage="Chưa có chính sách SLA nào."
          />
        </CardContent>
      </Card>

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        eyebrow="CHỈNH SỬA SLA"
        title={editing ? priorityNames[editing.priority] : ""}
        description="Thời gian giải quyết không được ngắn hơn thời gian phản hồi."
        submitLabel="Lưu thay đổi"
        isPending={updatePolicy.isPending}
        error={formError}
        onSubmit={submit}
      >
        {editing && (
          // Keyed on the policy so switching rows reseeds the uncontrolled
          // inputs instead of showing the previous row's values.
          <div key={editing.id} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sla-name">Tên chính sách</Label>
              <Input id="sla-name" name="name" defaultValue={editing.name} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="sla-response">Phản hồi (phút)</Label>
                <Input
                  id="sla-response"
                  name="responseMinutes"
                  type="number"
                  min={5}
                  defaultValue={editing.responseMinutes}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sla-resolution">Giải quyết (phút)</Label>
                <Input
                  id="sla-resolution"
                  name="resolutionMinutes"
                  type="number"
                  min={5}
                  defaultValue={editing.resolutionMinutes}
                  required
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="businessHoursOnly"
                defaultChecked={editing.businessHoursOnly}
              />
              Chỉ tính trong giờ hành chính
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={editing.active} />
              Đang áp dụng
            </label>
          </div>
        )}
      </FormDialog>
    </>
  );
}
