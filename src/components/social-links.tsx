import type { SocialLink } from "@/lib/profile";

const labels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X",
  tiktok: "TikTok",
  website: "Website",
};

export function SocialLinks({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-3">
      {links.map((link) => (
        <li key={`${link.platform}-${link.url}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            aria-label={labels[link.platform] ?? "Link"}
            className="grid size-10 place-items-center rounded-full bg-secondary text-foreground"
          >
            <SocialIcon platform={link.platform} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  if (platform === "instagram") return <InstagramMark />;
  if (platform === "facebook") return <FacebookMark />;
  if (platform === "youtube") return <YouTubeMark />;
  if (platform === "x") return <XMark />;
  if (platform === "tiktok") return <TikTokMark />;
  return <LinkMark />;
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" />
    </svg>
  );
}

function YouTubeMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M14.7 10.3 21.5 2h-1.6l-5.9 7.2L9.2 2H3l7.2 10.8L3 22h1.6l6.3-7.7L14.8 22H21l-6.3-11.7Zm-2.2 2.7-.7-1.1L5.2 3.3h2.5l4.7 6.9.7 1.1 6.1 9h-2.5l-4.2-6.3Z" />
    </svg>
  );
}

function TikTokMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M14 3h2.2a5.4 5.4 0 0 0 3.8 3.6v2.3a7.6 7.6 0 0 1-3.8-1v6.6a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.5a3.2 3.2 0 1 0 2.3 3.1V3Z" />
    </svg>
  );
}

function LinkMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.1.1l2.1-2.1a5 5 0 0 0-7.1-7.1L10.6 5.4" />
      <path d="M14 11a5 5 0 0 0-7.1-.1L4.8 13a5 5 0 0 0 7.1 7.1l1.4-1.5" />
    </svg>
  );
}
