"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Dialog
      open
      disablePointerDismissal={required}
      onOpenChange={(open) => {
        if (!open && !required) onClose();
      }}
    >
      <DialogContent showCloseButton={!required}>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              BẢO MẬT TÀI KHOẢN
            </p>
            <DialogTitle>
              {required ? "Cần đổi mật khẩu" : "Đổi mật khẩu"}
            </DialogTitle>
            {required && (
              <DialogDescription>
                Đây là mật khẩu tạm. Hãy đổi mật khẩu trước khi tiếp tục.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              minLength={12}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={12}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            {!required && (
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Đổi mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
