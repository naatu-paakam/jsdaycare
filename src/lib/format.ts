/** Format a phone number string to xxx-xxx-xxxx display format.
 *  Handles: 10-digit, +1 prefix, existing dashes/spaces/dots, or unknown → returns as-is.
 */
export function fmtPhone(raw: string | null | undefined): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  // Strip leading country code (1 or +1)
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length === 10) {
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return raw; // return original if can't format
}
