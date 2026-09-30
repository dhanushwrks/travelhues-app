export const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://65.2.235.120.sslip.io";

export function mediaUrl(path: string) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  return `${apiBase}${path}`;
}

export async function apiMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (body.message) return body.message;
  } catch {
    return "Could not reach Travelhues";
  }
  return "Could not reach Travelhues";
}
