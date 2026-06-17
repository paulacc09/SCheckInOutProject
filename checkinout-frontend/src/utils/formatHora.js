const OPCIONES_HORA = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

/**
 * Formatea instante UTC (ISO) o TIME MySQL (HH:MM:SS en sesión UTC) a hora local Colombia.
 */
export function horaCorta(d) {
  if (d == null || d === "") return "—";
  const s = String(d).trim();
  if (!s || s === "null") return "—";

  if (/^\d{2}:\d{2}/.test(s) && !/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const timePart = s.length >= 8 ? s.slice(0, 8) : `${s.padEnd(5, ":00")}:00`.slice(0, 8);
    const date = new Date(`1970-01-01T${timePart}Z`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("es-CO", OPCIONES_HORA);
    }
  }

  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return s.slice(0, 5);
  return date.toLocaleTimeString("es-CO", OPCIONES_HORA);
}
