export default function FlashBanner({ type, message, onClose }) {
  if (!message) return null;
  const cls =
    type === "error"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-emerald-50 text-emerald-900 border-emerald-200";
  return (
    <div className={`rounded-lg border px-4 py-2 text-sm flex justify-between items-center gap-3 ${cls}`}>
      <span>{message}</span>
      {onClose && (
        <button type="button" className="text-slate-500 hover:text-slate-800" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}
