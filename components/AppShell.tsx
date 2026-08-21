"use client";

import { ChevronsUpDownIcon, KeyRoundIcon, LogOutIcon, MenuIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export type NavItem = {
  key: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  disabled?: boolean;
  active?: boolean;
  onSelect?: () => void;
};

export type NavGroup = { label: string; items: NavItem[] };

/**
 * The application chrome — sidebar, top bar, content well.
 *
 * Everything here is driven by the design tokens rather than the hardcoded
 * hex values the legacy stylesheet used, so the whole shell follows light and
 * dark mode instead of the content area alone.
 */
export function AppShell({
  groups,
  brandInitial = "F",
  brandName = "Flowdesk",
  workspaceName,
  workspaceHint,
  breadcrumb,
  userName,
  userRole,
  userInitials,
  mobileNavOpen,
  onMobileNavChange,
  onSearch,
  onChangePassword,
  onLogout,
  actions,
  children,
}: {
  groups: NavGroup[];
  brandInitial?: string;
  brandName?: string;
  workspaceName: string;
  workspaceHint: string;
  breadcrumb: ReactNode;
  userName: string;
  userRole: string;
  userInitials: string;
  mobileNavOpen: boolean;
  onMobileNavChange: (open: boolean) => void;
  onSearch?: (term: string) => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted text-foreground">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => onMobileNavChange(false)}
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-1">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {brandInitial}
          </span>
          <b className="font-heading text-lg">{brandName}</b>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent p-2 text-sidebar-accent-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
            {workspaceName.charAt(0)}
          </span>
          <div className="grid leading-tight">
            <span className="truncate text-sm font-medium">{workspaceName}</span>
            <small className="truncate text-xs opacity-70">{workspaceHint}</small>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label} className="mb-4 grid gap-0.5">
              <p className="px-2 pb-1 text-[11px] font-medium tracking-wider uppercase opacity-50">
                {group.label}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.disabled}
                  onClick={item.onSelect}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "disabled:pointer-events-none disabled:opacity-40",
                    item.active &&
                      "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  )}
                >
                  <span className="flex size-5 items-center justify-center opacity-70">
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge variant="secondary">{item.badge}</Badge>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <Separator className="bg-sidebar-border" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Menu tài khoản"
                className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate text-sm font-medium">{userName}</span>
              <small className="truncate text-xs opacity-70">{userRole}</small>
            </div>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-1.5 py-1">
              <span className="block truncate text-sm font-medium">
                {userName}
              </span>
              <small className="block truncate text-muted-foreground">
                {userRole}
              </small>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onChangePassword}>
              <KeyRoundIcon />
              Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onLogout}>
              <LogOutIcon />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b bg-background px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Mở menu"
            onClick={() => onMobileNavChange(true)}
          >
            <MenuIcon />
          </Button>

          <span className="text-sm text-muted-foreground">{breadcrumb}</span>

          <div className="relative ml-auto hidden min-w-56 items-center md:flex">
            <SearchIcon className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Tìm ticket, nhân viên..."
              aria-label="Tìm ticket, nhân viên"
              onKeyDown={(event) => {
                if (event.key === "Enter")
                  onSearch?.(event.currentTarget.value);
              }}
            />
          </div>

          <div className="hidden items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs xl:flex">
            <span className="tracking-wide text-muted-foreground uppercase">
              Vai trò
            </span>
            <b>{userRole}</b>
          </div>

          <ThemeToggle />
          {actions}
        </header>

        <div
          className="min-w-0 flex-1 p-4 text-[clamp(0.9375rem,0.85vw+0.75rem,1.125rem)] lg:p-6"
        >
          {children}
        </div>
      </section>
    </div>
  );
}
