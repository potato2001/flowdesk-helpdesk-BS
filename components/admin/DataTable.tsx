"use client";

import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PageMetaDTO } from "@/application/dto/admin.dto";

export type Column<T> = {
  key: string;
  header: string;
  /**
   * Makes the header clickable to sort. Returns the value to compare — the
   * rendered cell is often JSX, so sorting needs a separate scalar.
   */
  sortValue?: (row: T) => string | number;
  /** Rendered on every screen size; `cell` owns its own layout. */
  cell: (row: T) => ReactNode;
  align?: "start" | "end";
  /** Hidden on mobile, where the card layout takes over. */
  hideOnMobile?: boolean;
};

type DataTableProps<T> = {
  rows: readonly T[];
  columns: ReadonlyArray<Column<T>>;
  rowKey: (row: T) => string;
  meta?: PageMetaDTO;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Card body used instead of the table below the md breakpoint. */
  mobileCard?: (row: T) => ReactNode;
};

type SortState = { key: string; direction: "asc" | "desc" } | null;

/**
 * The one table convention for the whole admin surface. Every entity screen
 * uses it so pagination, empty and loading states behave identically.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  meta,
  onPageChange,
  isLoading = false,
  emptyMessage = "Chưa có dữ liệu.",
  mobileCard,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);

  // Sorting applies to the rows currently on screen. With server pagination
  // that is the page, not the whole table — which is why the header only
  // offers it on columns whose full set fits one page.
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column?.sortValue) return rows;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => {
      const a = column.sortValue!(left);
      const b = column.sortValue!(right);
      if (typeof a === "number" && typeof b === "number")
        return (a - b) * factor;
      return String(a).localeCompare(String(b), "vi") * factor;
    });
  }, [rows, columns, sort]);

  function toggleSort(key: string) {
    setSort((old) =>
      old?.key !== key
        ? { key, direction: "asc" }
        : old.direction === "asc"
          ? { key, direction: "desc" }
          : null,
    );
  }

  const showEmpty = !isLoading && sorted.length === 0;

  return (
    <div className="grid gap-3">
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.align === "end" ? "text-right" : undefined}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      aria-label={`Sắp xếp theo ${column.header}`}
                    >
                      {column.header}
                      {sort?.key !== column.key ? (
                        <ArrowUpDownIcon className="size-3 opacity-40" />
                      ) : sort.direction === "asc" ? (
                        <ArrowUpIcon className="size-3" />
                      ) : (
                        <ArrowDownIcon className="size-3" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showEmpty && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {sorted.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={
                      column.align === "end" ? "text-right" : undefined
                    }
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {showEmpty && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
        {sorted.map((row) => (
          <div
            key={rowKey(row)}
            className="rounded-xl p-3 ring-1 ring-foreground/10"
          >
            {mobileCard ? (
              mobileCard(row)
            ) : (
              <dl className="grid gap-1 text-sm">
                {columns
                  .filter((column) => !column.hideOnMobile)
                  .map((column) => (
                    <div key={column.key} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{column.header}</dt>
                      <dd className="text-right">{column.cell(row)}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Trang {meta.page}/{meta.totalPages} · {meta.total} bản ghi
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1 || isLoading}
              onClick={() => onPageChange?.(meta.page - 1)}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages || isLoading}
              onClick={() => onPageChange?.(meta.page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
