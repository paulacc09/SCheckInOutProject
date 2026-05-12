import { useCallback, useMemo, useState } from "react";

function compareRows(a, b, sortCol, sortDir) {
  const aVal = a[sortCol];
  const bVal = b[sortCol];
  const aNum = typeof aVal === "number";
  const bNum = typeof bVal === "number";

  let cmp;
  if (aNum && bNum) {
    cmp = aVal - bVal;
  } else {
    cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""), "es", {
      sensitivity: "base",
    });
  }

  return sortDir === "asc" ? cmp : -cmp;
}

export function useSortable(rows) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const toggle = useCallback((col) => {
    setSortCol((prevCol) => {
      if (prevCol === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prevCol;
      }
      setSortDir("asc");
      return col;
    });
  }, []);

  const sorted = useMemo(() => {
    if (sortCol == null || !Array.isArray(rows)) return rows;

    return [...rows].sort((a, b) => compareRows(a, b, sortCol, sortDir));
  }, [rows, sortCol, sortDir]);

  return { toggle, sorted, sortCol, sortDir };
}
