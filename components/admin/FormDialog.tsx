"use client";

import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
};

/**
 * The one create/edit dialog convention for the admin surface: same header
 * shape, same error placement, same disable-while-pending submit button.
 *
 * The submit button declares type="submit" explicitly — Base UI's Button does
 * not infer it the way a native <button> does, and without it the form never
 * submits.
 */
export function FormDialog({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  children,
  submitLabel,
  pendingLabel = "Đang lưu...",
  isPending = false,
  error,
  onSubmit,
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            {eyebrow && (
              <p className="text-xs font-medium tracking-wide text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
