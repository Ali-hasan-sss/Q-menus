// Simple tailwind-merge implementation
export function twMerge(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(" ");
}
