"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optional: show "Showing X–Y of Z" label */
  totalItems?: number;
  perPage?: number;
  language?: string;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  perPage,
  language = "id",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-xs text-muted-foreground">
        {totalItems != null && perPage != null ? (
          language === "id"
            ? `Menampilkan ${(page - 1) * perPage + 1}–${Math.min(page * perPage, totalItems)} dari ${totalItems}`
            : `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, totalItems)} of ${totalItems}`
        ) : (
          language === "id"
            ? `Halaman ${page} dari ${totalPages}`
            : `Page ${page} of ${totalPages}`
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {language === "id" ? "Sebelumnya" : "Previous"}
        </button>
        <span className="text-xs font-medium tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {language === "id" ? "Berikutnya" : "Next"}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
