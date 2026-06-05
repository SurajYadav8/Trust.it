export function extractVerificationSlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    const verifyIdx = parts.indexOf("verify");
    if (verifyIdx >= 0 && parts[verifyIdx + 1]) {
      return parts[verifyIdx + 1];
    }
  } catch {
    // Not a URL — treat as slug.
  }

  return trimmed.replace(/^\/+|\/+$/g, "");
}
