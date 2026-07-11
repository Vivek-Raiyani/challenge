export function getAllowedOrigins(): string[] {
  const raw = process.env.FRONTEND_URL || "http://localhost:3000";
  return raw
    .split(",")
    .map((origin) => {
      const trimmed = origin.trim().replace(/\/+$/, ""); // strip trailing slashes
      if (!trimmed) return "";
      // Render's `host` property returns a bare hostname (no scheme).
      // Prepend https:// so CORS origin checks work correctly in production.
      return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    })
    .filter(Boolean);
}
