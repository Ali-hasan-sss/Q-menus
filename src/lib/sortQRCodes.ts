/** Natural / numeric sort for table labels so "2" comes before "10". */
export function compareTableNumbers(a: string, b: string): number {
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortQRCodesByTableNumber<T extends { tableNumber: string }>(
  codes: T[]
): T[] {
  if (codes.length === 0) return codes;
  return [...codes].sort((x, y) =>
    compareTableNumbers(x.tableNumber, y.tableNumber)
  );
}
