export default function SortTh({ col, sortCol, sortDir, onSort, children }) {
  const isActive = col === sortCol;

  let icon = null;
  if (!isActive) {
    icon = <span className="text-slate-300">⇅</span>;
  } else if (sortDir === "asc") {
    icon = <span className="text-[#1565C0]">↑</span>;
  } else {
    icon = <span className="text-[#1565C0]">↓</span>;
  }

  return (
    <th className="cursor-pointer select-none" onClick={() => onSort(col)}>
      <span className="inline-flex items-center gap-1.5">
        {children}
        {icon}
      </span>
    </th>
  );
}
