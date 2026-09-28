export type AccountRole = "tcc" | "traveler";

export function saveSession(session: {
  accessToken: string;
  user: { role: AccountRole; username: string; displayName: string };
}) {
  const maxAge = 60 * 60;
  writeCookie("th_access", session.accessToken, maxAge);
  writeCookie("th_role", session.user.role, maxAge);
  writeCookie("th_username", session.user.username, maxAge);
  writeCookie("th_name", encodeURIComponent(session.user.displayName), maxAge);
}

export function clearSession() {
  for (const name of ["th_access", "th_role", "th_username", "th_name"]) {
    writeCookie(name, "", 0);
  }
}

export function readCookie(name: string) {
  const row = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return row ? row.slice(name.length + 1) : "";
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
