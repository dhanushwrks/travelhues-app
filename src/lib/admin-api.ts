import { apiBase, apiMessage } from "@/lib/api";
import {
  audit,
  buildAnalytics,
  loadAdminStore,
  mutateAdminStore,
  newId,
  type AdminStore,
} from "@/lib/admin-mock";
import type {
  AdminContentItem,
  AdminInvite,
  AdminPurchase,
  AdminReport,
  AdminSettings,
  AdminUser,
  AnalyticsOverview,
  AuditEntry,
  ContentKind,
  CopyrightClaim,
  ModerationReason,
  ReportCategory,
  WaitlistEntry,
} from "@/lib/admin-types";
import { brandLinkDefaults } from "@/lib/remote";

const ADMIN_EMAIL = "admin@travelhues.in";
const ADMIN_PASSWORD = "Admin123@";

export const adminCredentials = {
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
} as const;

async function adminFetch(token: string, path: string, init?: RequestInit) {
  return fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function tryJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) return null;
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loginAdmin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  try {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalized, password, intent: "admin" }),
    });
    const payload = (await response.json().catch(() => null)) as {
      accessToken?: string;
      user?: { role: string; username: string; displayName: string };
      message?: string | string[];
    } | null;
    if (response.ok && payload?.accessToken && payload.user?.role === "admin") {
      return {
        accessToken: payload.accessToken,
        user: {
          role: "admin" as const,
          username: payload.user.username || "admin",
          displayName: payload.user.displayName || "Travelhues Admin",
        },
      };
    }
  } catch {
    // fall through to local admin credentials
  }

  if (normalized === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return {
      accessToken: `admin_local_${btoa(normalized)}`,
      user: {
        role: "admin" as const,
        username: "admin",
        displayName: "Travelhues Admin",
      },
    };
  }

  throw new Error("Invalid admin email or password");
}

function actorName() {
  if (typeof document === "undefined") return "admin";
  try {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith("th_username="));
    return raw ? decodeURIComponent(raw.slice("th_username=".length)) || "admin" : "admin";
  } catch {
    return "admin";
  }
}

export async function fetchAnalytics(token: string): Promise<AnalyticsOverview> {
  const response = await adminFetch(token, "/admin/analytics/overview").catch(() => null);
  const data = response ? await tryJson<AnalyticsOverview>(response) : null;
  if (data) return data;
  return buildAnalytics(loadAdminStore());
}

export async function fetchWaitlist(token: string): Promise<WaitlistEntry[]> {
  const response = await adminFetch(token, "/admin/waitlist").catch(() => null);
  const data = response ? await tryJson<WaitlistEntry[]>(response) : null;
  if (data) return data;
  return loadAdminStore().waitlist;
}

export async function inviteWaitlistEntry(token: string, id: string) {
  const response = await adminFetch(token, `/admin/waitlist/${id}/invite`, { method: "POST" }).catch(
    () => null,
  );
  if (response?.ok) return tryJson<{ invite: AdminInvite }>(response);

  let invite: AdminInvite | null = null;
  mutateAdminStore((store) => {
    const entry = store.waitlist.find((item) => item.id === id);
    if (!entry) throw new Error("Waitlist entry not found");
    const tokenValue = newId("inv");
    invite = {
      id: newId("i"),
      email: entry.email,
      token: tokenValue,
      url: `/join/${tokenValue}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      waitlistId: entry.id,
    };
    entry.status = "invited";
    entry.inviteToken = tokenValue;
    entry.inviteUrl = invite.url;
    store.invites.unshift(invite);
    audit(store, {
      actor: actorName(),
      action: "invite.created",
      target: entry.email,
      note: "Waitlist approve",
    });
  });
  return { invite: invite! };
}

export async function rejectWaitlistEntry(
  token: string,
  id: string,
  input: { reason: string; snooze?: boolean },
) {
  const response = await adminFetch(token, `/admin/waitlist/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(input),
  }).catch(() => null);
  if (response?.ok) return;

  mutateAdminStore((store) => {
    const entry = store.waitlist.find((item) => item.id === id);
    if (!entry) throw new Error("Waitlist entry not found");
    entry.status = input.snooze ? "snoozed" : "rejected";
    audit(store, {
      actor: actorName(),
      action: input.snooze ? "waitlist.snoozed" : "waitlist.rejected",
      target: entry.email,
      note: input.reason,
    });
  });
}

export async function fetchInvites(token: string): Promise<AdminInvite[]> {
  const response = await adminFetch(token, "/admin/invites").catch(() => null);
  const data = response ? await tryJson<AdminInvite[]>(response) : null;
  if (data) return data;
  return loadAdminStore().invites;
}

export async function revokeInvite(token: string, id: string) {
  const response = await adminFetch(token, `/admin/invites/${id}/revoke`, { method: "POST" }).catch(
    () => null,
  );
  if (response?.ok) return;

  mutateAdminStore((store) => {
    const invite = store.invites.find((item) => item.id === id);
    if (!invite) throw new Error("Invite not found");
    invite.status = "revoked";
    audit(store, { actor: actorName(), action: "invite.revoked", target: invite.email });
  });
}

export async function fetchAdminSettings(token: string): Promise<AdminSettings> {
  const response = await adminFetch(token, "/admin/settings").catch(() => null);
  const data = response ? await tryJson<AdminSettings>(response) : null;
  if (data) return data;

  const store = loadAdminStore();
  try {
    const settingsResponse = await fetch(`${apiBase}/settings`, { cache: "no-store" });
    if (settingsResponse.ok) {
      const remote = (await settingsResponse.json()) as {
        app?: Partial<AdminSettings["brand"]> & { enabledCountries?: string[] };
      };
      return {
        ...store.settings,
        enabledCountries: remote.app?.enabledCountries ?? store.settings.enabledCountries,
        brand: {
          instagramUrl: remote.app?.instagramUrl ?? brandLinkDefaults.instagramUrl,
          linkedinUrl: remote.app?.linkedinUrl ?? brandLinkDefaults.linkedinUrl,
          youtubeUrl: remote.app?.youtubeUrl ?? brandLinkDefaults.youtubeUrl,
          termsUrl: remote.app?.termsUrl ?? brandLinkDefaults.termsUrl,
          policiesUrl: remote.app?.policiesUrl ?? brandLinkDefaults.policiesUrl,
        },
      };
    }
  } catch {
    // use mock
  }
  return store.settings;
}

export async function saveAdminSettings(token: string, settings: AdminSettings) {
  const response = await adminFetch(token, "/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  }).catch(() => null);
  if (response?.ok) return settings;

  if (response && !response.ok && response.status !== 404) {
    throw new Error(await apiMessage(response));
  }

  mutateAdminStore((store) => {
    store.settings = settings;
    audit(store, {
      actor: actorName(),
      action: "settings.updated",
      target: "app",
      note: `Countries: ${settings.enabledCountries.join(", ")}`,
    });
  });
  return settings;
}

export async function fetchUsers(token: string, q = ""): Promise<AdminUser[]> {
  const response = await adminFetch(
    token,
    `/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`,
  ).catch(() => null);
  const data = response ? await tryJson<AdminUser[]>(response) : null;
  if (data) return data;
  const query = q.trim().toLowerCase();
  return loadAdminStore().users.filter((user) => {
    if (!query) return true;
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query)
    );
  });
}

export async function setUserStatus(
  token: string,
  userId: string,
  action: "hide" | "suspend" | "block" | "restore",
  input: { reason: ModerationReason; note: string; restoreContent?: boolean },
) {
  const response = await adminFetch(token, `/admin/users/${userId}/${action}`, {
    method: "POST",
    body: JSON.stringify(input),
  }).catch(() => null);
  if (response?.ok) return;

  mutateAdminStore((store) => {
    const user = store.users.find((item) => item.id === userId);
    if (!user) throw new Error("User not found");
    if (action === "hide") user.status = "hidden";
    if (action === "suspend") user.status = "suspended";
    if (action === "block") user.status = "blocked";
    if (action === "restore") user.status = "active";

    if (action === "suspend" || action === "block") {
      for (const item of store.content) {
        if (item.ownerUsername === user.username && item.status === "live") {
          item.status = "staff_unpublished";
        }
      }
      for (const invite of store.invites) {
        if (invite.email === user.email && invite.status === "pending") invite.status = "revoked";
      }
      for (const entry of store.waitlist) {
        if (entry.email === user.email) entry.status = "ineligible";
      }
    }

    if (action === "restore" && input.restoreContent) {
      for (const item of store.content) {
        if (item.ownerUsername === user.username && item.status === "staff_unpublished") {
          item.status = "live";
        }
      }
    }

    audit(store, {
      actor: actorName(),
      action: `user.${action}`,
      target: `@${user.username}`,
      reason: input.reason,
      note: input.note,
    });
  });
}

export async function fetchContent(
  token: string,
  query: { q?: string; status?: string; kind?: string } = {},
): Promise<AdminContentItem[]> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.kind) params.set("kind", query.kind);
  const suffix = params.size ? `?${params}` : "";
  const response = await adminFetch(token, `/admin/content${suffix}`).catch(() => null);
  const data = response ? await tryJson<AdminContentItem[]>(response) : null;
  if (data) return data;

  const q = (query.q ?? "").trim().toLowerCase();
  return loadAdminStore().content.filter((item) => {
    if (query.status && query.status !== "all" && item.status !== query.status) return false;
    if (query.kind && query.kind !== "all" && item.kind !== query.kind) return false;
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.ownerUsername.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });
}

export async function moderateContent(
  token: string,
  kind: ContentKind,
  id: string,
  action: "unpublish" | "remove" | "restore",
  input: { reason: ModerationReason; note: string },
) {
  const response = await adminFetch(token, `/admin/content/${kind}/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify(input),
  }).catch(() => null);
  if (response?.ok) return;

  mutateAdminStore((store) => {
    const item = store.content.find((row) => row.id === id && row.kind === kind);
    if (!item) throw new Error("Content not found");
    if (action === "unpublish") item.status = "staff_unpublished";
    if (action === "remove") item.status = "removed";
    if (action === "restore") {
      if (item.status === "removed") throw new Error("Hard-removed content cannot be restored");
      item.status = "live";
    }
    audit(store, {
      actor: actorName(),
      action: `content.${action}`,
      target: `${kind}:${id}`,
      reason: input.reason,
      note: input.note,
    });
  });
}

export async function fetchReports(token: string): Promise<AdminReport[]> {
  const response = await adminFetch(token, "/admin/reports").catch(() => null);
  const data = response ? await tryJson<AdminReport[]>(response) : null;
  if (data) return data;
  return loadAdminStore().reports;
}

export async function updateReport(
  token: string,
  id: string,
  input: {
    status?: AdminReport["status"];
    action?: "dismiss" | "warn" | "unpublish" | "remove" | "suspend" | "block" | "escalate_copyright";
    reason?: ModerationReason;
    note?: string;
  },
) {
  const response = await adminFetch(token, `/admin/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).catch(() => null);
  if (response?.ok) return;

  mutateAdminStore((store) => {
    const report = store.reports.find((item) => item.id === id);
    if (!report) throw new Error("Report not found");
    const reason = input.reason ?? "other";
    const note = input.note ?? "";

    if (input.action === "dismiss") report.status = "dismissed";
    else if (input.action === "warn") report.status = "actioned";
    else if (input.action === "escalate_copyright") {
      report.status = "actioned";
      store.copyrightClaims.unshift({
        id: newId("c"),
        status: "received",
        claimantName: report.reporterUsername,
        claimantEmail: `${report.reporterUsername}@users.travelhues`,
        workDescription: report.details || "Escalated from community report",
        infringingUrl: report.targetLabel,
        targetKind: report.targetKind,
        targetId: report.targetId,
        targetLabel: report.targetLabel,
        goodFaith: true,
        createdAt: new Date().toISOString(),
        note: "Escalated from report",
      });
    } else if (input.action === "unpublish" || input.action === "remove") {
      const content = store.content.find(
        (item) => item.id === report.targetId || item.title === report.targetLabel,
      );
      if (content) content.status = input.action === "remove" ? "removed" : "staff_unpublished";
      report.status = "actioned";
    } else if (input.action === "suspend" || input.action === "block") {
      const user = store.users.find((item) => item.username === report.targetOwnerUsername);
      if (user) {
        user.status = input.action === "block" ? "blocked" : "suspended";
        for (const item of store.content) {
          if (item.ownerUsername === user.username && item.status === "live") {
            item.status = "staff_unpublished";
          }
        }
      }
      report.status = "actioned";
    } else if (input.status) {
      report.status = input.status;
    }

    audit(store, {
      actor: actorName(),
      action: `report.${input.action ?? input.status ?? "update"}`,
      target: report.id,
      reason,
      note,
    });
  });
}

export async function submitReport(
  token: string | undefined,
  input: {
    category: ReportCategory;
    details: string;
    targetKind: ContentKind;
    targetId: string;
    targetLabel: string;
    targetOwnerUsername: string;
    targetOwnerRole: "tcc" | "traveler";
  },
) {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBase}/reports`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  }).catch(() => null);
  if (response?.ok) return;

  mutateAdminStore((store) => {
    store.reports.unshift({
      id: newId("r"),
      status: "open",
      category: input.category,
      details: input.details,
      createdAt: new Date().toISOString(),
      reporterUsername: actorName() || "guest",
      targetKind: input.targetKind,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      targetOwnerUsername: input.targetOwnerUsername,
      targetOwnerRole: input.targetOwnerRole,
    });
  });
}

export async function fetchCopyrightClaims(token: string): Promise<CopyrightClaim[]> {
  const response = await adminFetch(token, "/admin/copyright-claims").catch(() => null);
  const data = response ? await tryJson<CopyrightClaim[]>(response) : null;
  if (data) return data;
  return loadAdminStore().copyrightClaims;
}

export async function createCopyrightClaim(
  token: string,
  input: Omit<CopyrightClaim, "id" | "status" | "createdAt">,
) {
  const response = await adminFetch(token, "/admin/copyright-claims", {
    method: "POST",
    body: JSON.stringify(input),
  }).catch(() => null);
  if (response?.ok) return tryJson<CopyrightClaim>(response);

  let claim: CopyrightClaim | null = null;
  mutateAdminStore((store) => {
    claim = {
      ...input,
      id: newId("c"),
      status: "received",
      createdAt: new Date().toISOString(),
    };
    store.copyrightClaims.unshift(claim);
    if (store.settings.moderation.autoUnpublishOnCopyright) {
      const content = store.content.find((item) => item.id === input.targetId);
      if (content && content.status === "live") content.status = "staff_unpublished";
    }
    audit(store, {
      actor: actorName(),
      action: "copyright.created",
      target: claim.id,
      reason: "copyright",
      note: input.workDescription,
    });
  });
  return claim!;
}

export async function updateCopyrightClaim(
  token: string,
  id: string,
  input: {
    status?: CopyrightClaim["status"];
    action?: "delist" | "hard_remove" | "resolve" | "reject";
    note?: string;
  },
) {
  const response = await adminFetch(token, `/admin/copyright-claims/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).catch(() => null);
  if (response?.ok) return;

  mutateAdminStore((store) => {
    const claim = store.copyrightClaims.find((item) => item.id === id);
    if (!claim) throw new Error("Claim not found");
    const content = store.content.find(
      (item) => item.id === claim.targetId || item.title === claim.targetLabel,
    );

    if (input.action === "delist") {
      if (content && content.status === "live") content.status = "staff_unpublished";
      claim.status = "delisted";
    } else if (input.action === "hard_remove") {
      if (content) content.status = "removed";
      claim.status = "delisted";
    } else if (input.action === "resolve") {
      claim.status = "resolved";
    } else if (input.action === "reject") {
      claim.status = "rejected";
    } else if (input.status) {
      claim.status = input.status;
    }
    if (input.note) claim.note = input.note;

    audit(store, {
      actor: actorName(),
      action: `copyright.${input.action ?? input.status ?? "update"}`,
      target: claim.id,
      reason: "copyright",
      note: input.note,
    });
  });
}

export async function fetchPurchases(token: string): Promise<AdminPurchase[]> {
  const response = await adminFetch(token, "/admin/purchases").catch(() => null);
  const data = response ? await tryJson<AdminPurchase[]>(response) : null;
  if (data) return data;
  return loadAdminStore().purchases;
}

export async function refundPurchase(token: string, id: string, note: string) {
  const response = await adminFetch(token, `/admin/purchases/${id}/refund`, {
    method: "POST",
    body: JSON.stringify({ note }),
  }).catch(() => null);
  if (response?.ok) return;

  mutateAdminStore((store) => {
    const purchase = store.purchases.find((item) => item.id === id);
    if (!purchase) throw new Error("Purchase not found");
    purchase.status = "refunded";
    audit(store, {
      actor: actorName(),
      action: "purchase.refunded",
      target: purchase.id,
      note,
    });
  });
}

export async function fetchAuditLog(token: string): Promise<AuditEntry[]> {
  const response = await adminFetch(token, "/admin/audit").catch(() => null);
  const data = response ? await tryJson<AuditEntry[]>(response) : null;
  if (data) return data;
  return loadAdminStore().audit;
}

export function snapshotStore(): AdminStore {
  return loadAdminStore();
}
