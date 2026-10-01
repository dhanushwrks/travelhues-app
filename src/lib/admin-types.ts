export type ModerationReason =
  | "spam"
  | "harassment"
  | "fraud"
  | "copyright"
  | "tos"
  | "misleading"
  | "inappropriate"
  | "other";

export type AccountStatus = "active" | "hidden" | "suspended" | "blocked";

export type ContentKind = "story" | "spot" | "itinerary" | "blog" | "hue" | "post" | "profile";

export type ContentModerationStatus = "live" | "archived" | "staff_unpublished" | "removed";

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: "tcc" | "traveler";
  status: AccountStatus;
  joinedAt: string;
  stories: number;
  spots: number;
  itineraries: number;
  blogs: number;
  hues: number;
};

export type WaitlistStatus = "pending" | "invited" | "rejected" | "snoozed" | "ineligible";

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  country: string;
  note: string;
  status: WaitlistStatus;
  createdAt: string;
  inviteToken?: string;
  inviteUrl?: string;
};

export type InviteStatus = "pending" | "redeemed" | "expired" | "revoked";

export type AdminInvite = {
  id: string;
  email: string;
  token: string;
  url: string;
  status: InviteStatus;
  createdAt: string;
  waitlistId?: string;
};

export type ReportStatus = "open" | "in_review" | "actioned" | "dismissed";

export type ReportCategory =
  | "spam"
  | "misleading"
  | "inappropriate"
  | "harassment"
  | "copyright"
  | "other";

export type AdminReport = {
  id: string;
  status: ReportStatus;
  category: ReportCategory;
  details: string;
  createdAt: string;
  reporterUsername: string;
  targetKind: ContentKind;
  targetId: string;
  targetLabel: string;
  targetOwnerUsername: string;
  targetOwnerRole: "tcc" | "traveler";
};

export type CopyrightStatus = "received" | "delisted" | "resolved" | "rejected";

export type CopyrightClaim = {
  id: string;
  status: CopyrightStatus;
  claimantName: string;
  claimantEmail: string;
  workDescription: string;
  infringingUrl: string;
  targetKind: ContentKind;
  targetId: string;
  targetLabel: string;
  goodFaith: boolean;
  createdAt: string;
  note?: string;
};

export type AdminContentItem = {
  id: string;
  kind: ContentKind;
  title: string;
  ownerUsername: string;
  country: string;
  status: ContentModerationStatus;
  purchaseOnly: boolean;
  priceInr?: number;
  createdAt: string;
  publicPath?: string;
};

export type PurchaseStatus = "completed" | "refunded" | "failed";

export type AdminPurchase = {
  id: string;
  buyerUsername: string;
  storySlug: string;
  kind: "spot" | "itinerary" | "blog";
  itemId: string;
  itemTitle: string;
  amountInr: number;
  status: PurchaseStatus;
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  reason?: ModerationReason | string;
  note?: string;
};

export type AdminSettings = {
  enabledCountries: string[];
  brand: {
    instagramUrl: string;
    linkedinUrl: string;
    youtubeUrl: string;
    termsUrl: string;
    policiesUrl: string;
  };
  defaults: {
    priceInr: number;
  };
  moderation: {
    reportSlaHours: number;
    autoUnpublishOnCopyright: boolean;
    appealContactEmail: string;
  };
};

export type AnalyticsOverview = {
  rangeDays: number;
  travelersNew: number;
  creatorsNew: number;
  waitlistOpen: number;
  invitesSent: number;
  invitesRedeemed: number;
  storiesPublished: number;
  findsCreated: number;
  plansCreated: number;
  blogsCreated: number;
  huesPosted: number;
  saves: number;
  purchases: number;
  gmvInr: number;
  openReports: number;
  openCopyrightClaims: number;
  oldestReportAgeHours: number | null;
  removals7d: number;
  blocks7d: number;
  series: { date: string; travelers: number; creators: number; purchases: number; gmvInr: number }[];
  topPaid: { title: string; kind: string; count: number; gmvInr: number }[];
  activation: { invited: number; signedUp: number; firstStory: number };
  markets: { country: string; stories: number; purchases: number }[];
};

export const moderationReasons: { id: ModerationReason; label: string }[] = [
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Harassment" },
  { id: "fraud", label: "Fraud" },
  { id: "copyright", label: "Copyright" },
  { id: "tos", label: "Terms of service" },
  { id: "misleading", label: "Misleading" },
  { id: "inappropriate", label: "Inappropriate" },
  { id: "other", label: "Other" },
];

export const reportCategories: { id: ReportCategory; label: string }[] = [
  { id: "spam", label: "Spam" },
  { id: "misleading", label: "Misleading" },
  { id: "inappropriate", label: "Inappropriate" },
  { id: "harassment", label: "Harassment" },
  { id: "copyright", label: "Copyright" },
  { id: "other", label: "Other" },
];
