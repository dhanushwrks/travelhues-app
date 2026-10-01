import type {
  AdminContentItem,
  AdminInvite,
  AdminPurchase,
  AdminReport,
  AdminSettings,
  AdminUser,
  AnalyticsOverview,
  AuditEntry,
  CopyrightClaim,
  WaitlistEntry,
} from "@/lib/admin-types";

const STORAGE_KEY = "th_admin_store_v1";

export type AdminStore = {
  users: AdminUser[];
  waitlist: WaitlistEntry[];
  invites: AdminInvite[];
  reports: AdminReport[];
  copyrightClaims: CopyrightClaim[];
  content: AdminContentItem[];
  purchases: AdminPurchase[];
  audit: AuditEntry[];
  settings: AdminSettings;
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seed(): AdminStore {
  return {
    users: [
      {
        id: "u_maya",
        email: "maya@example.com",
        username: "maya.rivers",
        displayName: "Maya Rivers",
        role: "tcc",
        status: "active",
        joinedAt: daysAgo(120),
        stories: 3,
        spots: 28,
        itineraries: 4,
        blogs: 2,
        hues: 6,
      },
      {
        id: "u_arjun",
        email: "arjun@example.com",
        username: "arjun.k",
        displayName: "Arjun K",
        role: "tcc",
        status: "active",
        joinedAt: daysAgo(80),
        stories: 1,
        spots: 9,
        itineraries: 1,
        blogs: 0,
        hues: 2,
      },
      {
        id: "u_priya",
        email: "priya@example.com",
        username: "priya.travels",
        displayName: "Priya",
        role: "traveler",
        status: "active",
        joinedAt: daysAgo(40),
        stories: 0,
        spots: 0,
        itineraries: 0,
        blogs: 0,
        hues: 0,
      },
      {
        id: "u_spam",
        email: "spam@example.com",
        username: "cheap.deals",
        displayName: "Deals Bot",
        role: "traveler",
        status: "active",
        joinedAt: daysAgo(3),
        stories: 0,
        spots: 0,
        itineraries: 0,
        blogs: 0,
        hues: 0,
      },
    ],
    waitlist: [
      {
        id: "w1",
        name: "Neha Shah",
        email: "neha@example.com",
        country: "IN",
        note: "Food creator, Mumbai + Goa",
        status: "pending",
        createdAt: daysAgo(5),
      },
      {
        id: "w2",
        name: "Leo Tran",
        email: "leo@example.com",
        country: "TH",
        note: "Bangkok street food + temples",
        status: "pending",
        createdAt: daysAgo(2),
      },
      {
        id: "w3",
        name: "Sam Okeke",
        email: "sam@example.com",
        country: "IN",
        note: "Rajasthan road trips",
        status: "invited",
        createdAt: daysAgo(12),
        inviteToken: "inv_sam",
        inviteUrl: "/join/inv_sam",
      },
    ],
    invites: [
      {
        id: "i1",
        email: "sam@example.com",
        token: "inv_sam",
        url: "/join/inv_sam",
        status: "pending",
        createdAt: daysAgo(11),
        waitlistId: "w3",
      },
      {
        id: "i2",
        email: "maya@example.com",
        token: "inv_maya",
        url: "/join/inv_maya",
        status: "redeemed",
        createdAt: daysAgo(118),
      },
    ],
    reports: [
      {
        id: "r1",
        status: "open",
        category: "spam",
        details: "Profile is only affiliate spam links",
        createdAt: daysAgo(1),
        reporterUsername: "priya.travels",
        targetKind: "profile",
        targetId: "u_spam",
        targetLabel: "@cheap.deals",
        targetOwnerUsername: "cheap.deals",
        targetOwnerRole: "traveler",
      },
      {
        id: "r2",
        status: "open",
        category: "misleading",
        details: "Stay prices look fabricated",
        createdAt: daysAgo(0.4),
        reporterUsername: "priya.travels",
        targetKind: "spot",
        targetId: "spot_riverside",
        targetLabel: "Riverside Homestay",
        targetOwnerUsername: "maya.rivers",
        targetOwnerRole: "tcc",
      },
    ],
    copyrightClaims: [
      {
        id: "c1",
        status: "received",
        claimantName: "Lens Co.",
        claimantEmail: "legal@lensco.example",
        workDescription: "Commercial photo TH-8821 of Chao Phraya at dusk",
        infringingUrl: "/stories/maya.rivers/bangkok-week/blogs/night-markets",
        targetKind: "blog",
        targetId: "blog_night",
        targetLabel: "Night markets walk",
        goodFaith: true,
        createdAt: daysAgo(0.8),
      },
    ],
    content: [
      {
        id: "story_bkk",
        kind: "story",
        title: "Bangkok week",
        ownerUsername: "maya.rivers",
        country: "TH",
        status: "live",
        purchaseOnly: false,
        createdAt: daysAgo(90),
        publicPath: "/stories/maya.rivers/bangkok-week",
      },
      {
        id: "spot_riverside",
        kind: "spot",
        title: "Riverside Homestay",
        ownerUsername: "maya.rivers",
        country: "TH",
        status: "live",
        purchaseOnly: true,
        priceInr: 149,
        createdAt: daysAgo(85),
        publicPath: "/stories/maya.rivers/bangkok-week?spot=spot_riverside",
      },
      {
        id: "plan_day3",
        kind: "itinerary",
        title: "Old town in 3 days",
        ownerUsername: "maya.rivers",
        country: "TH",
        status: "live",
        purchaseOnly: true,
        priceInr: 199,
        createdAt: daysAgo(70),
        publicPath: "/stories/maya.rivers/bangkok-week/itineraries/old-town-3",
      },
      {
        id: "blog_night",
        kind: "blog",
        title: "Night markets walk",
        ownerUsername: "maya.rivers",
        country: "TH",
        status: "live",
        purchaseOnly: false,
        createdAt: daysAgo(60),
        publicPath: "/stories/maya.rivers/bangkok-week/blogs/night-markets",
      },
      {
        id: "hue_1",
        kind: "hue",
        title: "Ferry crossing",
        ownerUsername: "arjun.k",
        country: "IN",
        status: "live",
        purchaseOnly: false,
        createdAt: daysAgo(10),
      },
      {
        id: "story_jaipur",
        kind: "story",
        title: "Jaipur weekend",
        ownerUsername: "arjun.k",
        country: "IN",
        status: "live",
        purchaseOnly: false,
        createdAt: daysAgo(20),
        publicPath: "/stories/arjun.k/jaipur-weekend",
      },
    ],
    purchases: [
      {
        id: "p1",
        buyerUsername: "priya.travels",
        storySlug: "bangkok-week",
        kind: "spot",
        itemId: "spot_riverside",
        itemTitle: "Riverside Homestay",
        amountInr: 149,
        status: "completed",
        createdAt: daysAgo(4),
      },
      {
        id: "p2",
        buyerUsername: "priya.travels",
        storySlug: "bangkok-week",
        kind: "itinerary",
        itemId: "plan_day3",
        itemTitle: "Old town in 3 days",
        amountInr: 199,
        status: "completed",
        createdAt: daysAgo(3),
      },
      {
        id: "p3",
        buyerUsername: "guest.buyer",
        storySlug: "bangkok-week",
        kind: "spot",
        itemId: "spot_riverside",
        itemTitle: "Riverside Homestay",
        amountInr: 149,
        status: "completed",
        createdAt: daysAgo(1),
      },
    ],
    audit: [
      {
        id: "a0",
        at: daysAgo(20),
        actor: "admin",
        action: "invite.created",
        target: "sam@example.com",
        note: "Waitlist approve",
      },
    ],
    settings: {
      enabledCountries: ["TH", "IN"],
      brand: {
        instagramUrl: "https://www.instagram.com/travelhues",
        linkedinUrl: "https://www.linkedin.com/company/travelhues",
        youtubeUrl: "https://www.youtube.com/@travelhues",
        termsUrl: "https://travelhues.com/terms",
        policiesUrl: "https://travelhues.com/policies",
      },
      defaults: { priceInr: 99 },
      moderation: {
        reportSlaHours: 48,
        autoUnpublishOnCopyright: false,
        appealContactEmail: "trust@travelhues.in",
      },
    },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let memory = seed();

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadAdminStore(): AdminStore {
  if (!canUseStorage()) return clone(memory);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memory = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
      return clone(memory);
    }
    memory = JSON.parse(raw) as AdminStore;
    return clone(memory);
  } catch {
    memory = seed();
    return clone(memory);
  }
}

export function saveAdminStore(next: AdminStore) {
  memory = clone(next);
  if (canUseStorage()) localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  return clone(memory);
}

export function mutateAdminStore(mutator: (store: AdminStore) => void) {
  const store = loadAdminStore();
  mutator(store);
  return saveAdminStore(store);
}

export function resetAdminStore() {
  memory = seed();
  if (canUseStorage()) localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  return clone(memory);
}

export function buildAnalytics(store: AdminStore, rangeDays = 30): AnalyticsOverview {
  const series = Array.from({ length: Math.min(rangeDays, 14) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toISOString().slice(0, 10),
      travelers: 4 + (i % 5),
      creators: 1 + (i % 3),
      purchases: i % 4,
      gmvInr: (i % 4) * 120,
    };
  });
  const openReports = store.reports.filter((r) => r.status === "open" || r.status === "in_review");
  const oldest = openReports
    .map((r) => (Date.now() - new Date(r.createdAt).getTime()) / 36e5)
    .sort((a, b) => b - a)[0];
  const completed = store.purchases.filter((p) => p.status === "completed");
  return {
    rangeDays,
    travelersNew: 86,
    creatorsNew: 12,
    waitlistOpen: store.waitlist.filter((w) => w.status === "pending").length,
    invitesSent: store.invites.length,
    invitesRedeemed: store.invites.filter((i) => i.status === "redeemed").length,
    storiesPublished: store.content.filter((c) => c.kind === "story" && c.status === "live").length,
    findsCreated: store.content.filter((c) => c.kind === "spot").length,
    plansCreated: store.content.filter((c) => c.kind === "itinerary").length,
    blogsCreated: store.content.filter((c) => c.kind === "blog").length,
    huesPosted: store.content.filter((c) => c.kind === "hue").length,
    saves: 214,
    purchases: completed.length,
    gmvInr: completed.reduce((sum, p) => sum + p.amountInr, 0),
    openReports: openReports.length,
    openCopyrightClaims: store.copyrightClaims.filter((c) => c.status === "received" || c.status === "delisted")
      .length,
    oldestReportAgeHours: oldest ? Math.round(oldest) : null,
    removals7d: store.audit.filter((a) => a.action.includes("content.")).length,
    blocks7d: store.audit.filter((a) => a.action.includes("user.block") || a.action.includes("user.suspend")).length,
    series,
    topPaid: [
      { title: "Old town in 3 days", kind: "itinerary", count: 1, gmvInr: 199 },
      { title: "Riverside Homestay", kind: "spot", count: 2, gmvInr: 298 },
    ],
    activation: { invited: store.invites.length, signedUp: 9, firstStory: 7 },
    markets: [
      { country: "TH", stories: 1, purchases: completed.filter((p) => p.storySlug.includes("bangkok")).length },
      { country: "IN", stories: 1, purchases: 0 },
    ],
  };
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function audit(
  store: AdminStore,
  entry: Omit<AuditEntry, "id" | "at"> & { at?: string },
) {
  store.audit.unshift({
    id: newId("a"),
    at: entry.at ?? new Date().toISOString(),
    actor: entry.actor,
    action: entry.action,
    target: entry.target,
    reason: entry.reason,
    note: entry.note,
  });
}
