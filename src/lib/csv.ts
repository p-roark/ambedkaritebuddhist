/**
 * Builds RFC 4180 CSV. Cells that a spreadsheet would treat as a formula
 * (starting with = + - @ or a tab/carriage return) are prefixed with ' so
 * member-entered text can't run formulas when the file is opened in Excel/Sheets.
 */
export type CsvValue = string | number | boolean | null | undefined;

export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvValue[][]): string {
  // Leading BOM so Excel opens UTF-8 (accented names, Devanagari) correctly
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
