/**
 * Утилита для экспорта данных в CSV
 */

export function convertToCSV(
  headers: string[],
  rows: Record<string, string | number>[],
): string {
  const escapeCSV = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerRow = headers.map(escapeCSV).join(",");
  const dataRows = rows.map((row) =>
    headers.map((header) => escapeCSV(String(row[header] || ""))).join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function generateExportFilename(gigTitle: string): string {
  const sanitizedTitle = gigTitle
    .toLowerCase()
    .replace(/[^а-яa-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 30);

  const date = new Date().toISOString().split("T")[0];
  return `отклики_${sanitizedTitle}_${date}.csv`;
}
