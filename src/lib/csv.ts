/**
 * CSV export. Text cells that start with =, +, -, @, tab or carriage return
 * get a leading ' so spreadsheet apps show them as text instead of running
 * them as formulas: exported notes are text anyone could have submitted.
 * Numbers are left as they are.
 */

const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows as CSV text. Columns are every key that appears, in first-seen order. */
export function toCsv(rows: Record<string, unknown>[]): string {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = rows.map((row) => columns.map((column) => escapeCell(row[column])).join(","));
  return [columns.map(escapeCell).join(","), ...lines].join("\n");
}

/** Save rows as a CSV file in the browser */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;

  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
