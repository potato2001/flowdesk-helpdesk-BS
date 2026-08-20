"use client";

import { FormEvent, useState } from "react";
import type { AdminUserDTO } from "@/application/dto/user.dto";
import { ROLES, type Role } from "@/domain/user/role";
import { PASSWORD_RULE_TEXT } from "@/domain/user/password-policy";
import { ApiError } from "@/client/api/http";
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
} from "@/client/queries/admin.queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageHeading } from "./AdminPageHeading";
import { DataTable, type Column } from "./DataTable";
import { FormDialog } from "./FormDialog";

const roleNames: Record<Role, string> = {
  REQUESTER: "Requester",
  AGENT: "Agent",
  MANAGER: "Manager",
  ADMIN: "Admin",
};
const roleItems = ROLES.map((value) => ({ value, label: roleNames[value] }));
const ANY = "__any__";
// Base UI renders the raw value unless `items` maps it to a label, so the
// sentinel option must be part of the items list, not just a <SelectItem>.
const roleFilterItems = [
  { value: ANY, label: "Mọi vai trò" },
  ...roleItems,
];
const activeFilterItems = [
  { value: ANY, label: "Mọi trạng thái" },
  { value: "true", label: "Đang hoạt động" },
  { value: "false", label: "Đã vô hiệu hóa" },
];

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function AdminUsers({ notify }: { notify: (message: string) => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ANY);
  const [activeFilter, setActiveFilter] = useState<string>(ANY);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<AdminUserDTO | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filters live in the query key, so each combination caches independently
  // and switching back to a previous filter is instant.
  const query = {
    page,
    pageSize: 10,
    search: search.trim() || undefined,
    role: roleFilter === ANY ? undefined : (roleFilter as Role),
    active: activeFilter === ANY ? undefined : activeFilter === "true",
  };
  const usersQuery = useAdminUsers(query);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const locked = (user: AdminUserDTO) =>
    Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());

  function patch(id: string, body: Parameters<typeof updateUser.mutate>[0]["body"], success: string) {
    updateUser.mutate(
      { id, body },
      {
        onSuccess: () => notify(success),
        onError: (error) =>
          notify(message(error, "Không thể cập nhật tài khoản.")),
      },
    );
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = new FormData(event.currentTarget);
    createUser.mutate(
      {
        name: String(form.get("name")),
        email: String(form.get("email")),
        department: String(form.get("department") || "") || null,
        role: form.get("role") as Role,
        temporaryPassword: String(form.get("temporaryPassword")),
      },
      {
        onSuccess: (user) => {
          setCreateOpen(false);
          notify(`Đã tạo tài khoản ${user.email}`);
        },
        onError: (error) =>
          setFormError(message(error, "Không thể tạo tài khoản.")),
      },
    );
  }

  function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!resetUser) return;
    const form = new FormData(event.currentTarget);
    updateUser.mutate(
      {
        id: resetUser.id,
        body: { temporaryPassword: String(form.get("temporaryPassword")) },
      },
      {
        onSuccess: () => {
          setResetUser(null);
          notify("Đã đặt mật khẩu tạm và đăng xuất mọi phiên cũ");
        },
        onError: (error) =>
          setFormError(message(error, "Không thể đặt lại mật khẩu.")),
      },
    );
  }

  const stateBadge = (user: AdminUserDTO) =>
    !user.active ? (
      <Badge variant="destructive">Vô hiệu hóa</Badge>
    ) : locked(user) ? (
      <Badge variant="destructive">Tạm khóa</Badge>
    ) : (
      <Badge variant="secondary">Hoạt động</Badge>
    );

  const actions = (user: AdminUserDTO) => (
    <div className="flex flex-wrap justify-end gap-1">
      {locked(user) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => patch(user.id, { unlock: true }, "Đã mở khóa tài khoản")}
        >
          Mở khóa
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setFormError(null);
          setResetUser(user);
        }}
      >
        Đặt mật khẩu
      </Button>
      <Button
        type="button"
        variant={user.active ? "destructive" : "ghost"}
        size="sm"
        onClick={() =>
          patch(
            user.id,
            { active: !user.active },
            user.active
              ? "Đã vô hiệu hóa tài khoản"
              : "Đã kích hoạt tài khoản",
          )
        }
      >
        {user.active ? "Vô hiệu hóa" : "Kích hoạt"}
      </Button>
    </div>
  );

  const columns: Column<AdminUserDTO>[] = [
    {
      key: "user",
      header: "Người dùng",
      sortValue: (user) => user.name,
      cell: (user) => (
        <>
          <b className="block">{user.name}</b>
          <small className="text-muted-foreground">{user.email}</small>
        </>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      cell: (user) => (
        <Select
          value={user.role}
          items={roleItems}
          onValueChange={(value) =>
            patch(user.id, { role: value as Role }, "Đã cập nhật vai trò")
          }
        >
          <SelectTrigger size="sm" aria-label={`Vai trò của ${user.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "department",
      header: "Phòng ban",
      sortValue: (user) => user.department ?? "",
      cell: (user) => user.department || "—",
    },
    {
      key: "state",
      header: "Trạng thái",
      cell: (user) => (
        <div className="flex flex-col items-start gap-1">
          {stateBadge(user)}
          {user.mustChangePassword && (
            <small className="text-muted-foreground">Cần đổi mật khẩu</small>
          )}
        </div>
      ),
    },
    { key: "actions", header: "Thao tác", align: "end", cell: actions },
  ];

  return (
    <>
      <AdminPageHeading
        eyebrow="QUẢN TRỊ HỆ THỐNG"
        title="Tài khoản & phân quyền"
        description="Quản lý quyền truy cập, trạng thái đăng nhập và mật khẩu tạm."
        action={
          <Button
            type="button"
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
          >
            ＋ Thêm tài khoản
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            THÀNH VIÊN
          </p>
          <CardTitle>
            {usersQuery.isPending
              ? "Đang tải..."
              : `${usersQuery.data?.meta.total ?? 0} tài khoản`}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-60"
              placeholder="Tìm theo tên, email, phòng ban"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              aria-label="Tìm tài khoản"
            />
            <Select
              value={roleFilter}
              items={roleFilterItems}
              onValueChange={(value) => {
                setPage(1);
                setRoleFilter(String(value));
              }}
            >
              <SelectTrigger size="sm" aria-label="Lọc theo vai trò">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeFilter}
              items={activeFilterItems}
              onValueChange={(value) => {
                setPage(1);
                setActiveFilter(String(value));
              }}
            >
              <SelectTrigger size="sm" aria-label="Lọc theo trạng thái">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {usersQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
              {message(usersQuery.error, "Không thể tải danh sách tài khoản.")}
            </p>
          )}

          <DataTable
            rows={usersQuery.data?.users ?? []}
            columns={columns}
            rowKey={(user) => user.id}
            meta={usersQuery.data?.meta}
            onPageChange={setPage}
            isLoading={usersQuery.isFetching}
            emptyMessage="Không có tài khoản nào khớp bộ lọc."
            mobileCard={(user) => (
              <div className="grid gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <b className="block">{user.name}</b>
                    <small className="text-muted-foreground">{user.email}</small>
                  </div>
                  {stateBadge(user)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {roleNames[user.role]} · {user.department || "Chưa có phòng ban"}
                </p>
                {actions(user)}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        eyebrow="TÀI KHOẢN MỚI"
        title="Thêm thành viên"
        submitLabel="Tạo tài khoản"
        isPending={createUser.isPending}
        error={formError}
        onSubmit={submitCreate}
        className="sm:max-w-lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="new-user-name">Họ tên</Label>
            <Input id="new-user-name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input id="new-user-email" name="email" type="email" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Vai trò</Label>
            <Select name="role" defaultValue="REQUESTER" items={roleItems}>
              <SelectTrigger className="w-full" aria-label="Vai trò">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-department">Phòng ban</Label>
            <Input id="new-user-department" name="department" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-user-password">Mật khẩu tạm</Label>
          <Input
            id="new-user-password"
            name="temporaryPassword"
            type="password"
            minLength={12}
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">{PASSWORD_RULE_TEXT}</p>
      </FormDialog>

      <FormDialog
        open={Boolean(resetUser)}
        onOpenChange={(open) => !open && setResetUser(null)}
        eyebrow="ĐẶT LẠI MẬT KHẨU"
        title={resetUser?.name ?? ""}
        description="Mọi phiên đăng nhập hiện tại sẽ bị đóng. Người dùng phải đổi mật khẩu sau lần đăng nhập kế tiếp."
        submitLabel="Đặt lại mật khẩu"
        isPending={updateUser.isPending}
        error={formError}
        onSubmit={submitReset}
      >
        <div className="grid gap-2">
          <Label htmlFor="reset-password">Mật khẩu tạm mới</Label>
          <Input
            id="reset-password"
            name="temporaryPassword"
            type="password"
            minLength={12}
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">{PASSWORD_RULE_TEXT}</p>
      </FormDialog>
    </>
  );
}
