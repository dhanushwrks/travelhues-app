import { SocialIcon } from "@/components/social-links";
import type { BrandLinks } from "@/lib/remote";

export function BrandFooter({ links }: { links: BrandLinks }) {
  const socials = [
    { platform: "linkedin", label: "LinkedIn", url: httpUrl(links.linkedinUrl) },
    { platform: "instagram", label: "Instagram", url: httpUrl(links.instagramUrl) },
    { platform: "youtube", label: "YouTube", url: httpUrl(links.youtubeUrl) },
  ].filter((item) => item.url);
  const terms = httpUrl(links.termsUrl);
  const policies = httpUrl(links.policiesUrl);

  if (socials.length === 0 && !terms && !policies) return null;

  return (
    <footer className="flex shrink-0 flex-col items-center gap-3 px-5 pt-4 pb-6">
      {socials.length > 0 ? (
        <ul className="flex gap-3">
          {socials.map((item) => (
            <li key={item.platform}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="grid size-10 place-items-center rounded-full bg-secondary text-foreground"
              >
                <SocialIcon platform={item.platform} />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {terms || policies ? (
        <p className="text-center text-xs text-muted-foreground">
          {terms ? (
            <a href={terms} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Terms
            </a>
          ) : null}
          {terms && policies ? <span aria-hidden> · </span> : null}
          {policies ? (
            <a href={policies} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Policies
            </a>
          ) : null}
        </p>
      ) : null}
    </footer>
  );
}

function httpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}
