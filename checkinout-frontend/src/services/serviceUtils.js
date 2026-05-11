/** Simula latencia de red hasta conectar API real */
export const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export const ok = (data) => ({ ok: true, data });
export const fail = (message) => ({ ok: false, message });
