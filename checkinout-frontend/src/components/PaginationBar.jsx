import { buildPageNumbers } from "../services/pagination";

export default function PaginationBar({ page, totalPages, onChange }) {
  const nums = buildPageNumbers(page, totalPages);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 py-3">
      <button
        type="button"
        className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        « Previous
      </button>
      {nums.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`}>{p}</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`min-w-[2rem] px-2 py-1 rounded ${
              p === page ? "bg-[#1565C0] text-white" : "hover:bg-slate-100"
            }`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next »
      </button>
    </div>
  );
}
