"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageLoader } from "@/components/loader";
import { fetchAnalytics } from "@/lib/admin-api";
import type { AnalyticsOverview } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";
import { formatInr } from "@/lib/format";

export function AdminAnalyticsPage({ focus = "overview" }: { focus?: "overview" | "monetization" }) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = readCookie("th_access");
    void fetchAnalytics(token)
      .then(setData)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load analytics"));
  }, []);

  if (error) return <p className="px-5 pt-8 text-sm text-primary">{error}</p>;
  if (!data) return <PageLoader label="Loading analytics" />;

  const cards = [
    { label: "New travelers", value: String(data.travelersNew) },
    { label: "New creators", value: String(data.creatorsNew) },
    { label: "Waitlist open", value: String(data.waitlistOpen) },
    { label: "Invites redeemed", value: `${data.invitesRedeemed}/${data.invitesSent}` },
    { label: "Stories live", value: String(data.storiesPublished) },
    { label: "Purchases", value: String(data.purchases) },
    { label: "GMV", value: formatInr(data.gmvInr) },
    { label: "Open reports", value: String(data.openReports) },
  ];

  return (
    <div className="px-5 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">
            {focus === "monetization" ? "Monetization" : "Analytics"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Last {data.rangeDays} days · platform health
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin"
            className={`rounded-full px-3 py-1.5 ${focus === "overview" ? "bg-secondary font-medium" : "text-muted-foreground"}`}
          >
            Overview
          </Link>
          <Link
            href="/admin/analytics/monetization"
            className={`rounded-full px-3 py-1.5 ${focus === "monetization" ? "bg-secondary font-medium" : "text-muted-foreground"}`}
          >
            Monetization
          </Link>
        </div>
      </div>

      {data.oldestReportAgeHours != null && data.oldestReportAgeHours > 48 ? (
        <p className="mt-4 rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
          Oldest open report is {data.oldestReportAgeHours}h old (SLA 48h).{" "}
          <Link href="/admin/manage/reports" className="font-medium underline">
            Open queue
          </Link>
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-secondary px-4 py-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{card.label}</p>
            <p className="mt-2 text-2xl font-medium">{card.value}</p>
          </div>
        ))}
      </div>

      {focus === "overview" ? (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-medium">Creator activation</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <FunnelStep label="Invited" value={data.activation.invited} />
              <FunnelStep label="Signed up" value={data.activation.signedUp} />
              <FunnelStep label="First story" value={data.activation.firstStory} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-medium">Supply</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Finds" value={data.findsCreated} />
              <Stat label="Plans" value={data.plansCreated} />
              <Stat label="Blogs" value={data.blogsCreated} />
              <Stat label="Hues" value={data.huesPosted} />
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-medium">Trust & safety</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Open reports" value={data.openReports} />
              <Stat label="Copyright open" value={data.openCopyrightClaims} />
              <Stat label="Removals 7d" value={data.removals7d} />
              <Stat label="Blocks 7d" value={data.blocks7d} />
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-medium">Markets</h2>
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
              {data.markets.map((market) => (
                <li key={market.country} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{market.country}</span>
                  <span className="text-muted-foreground">
                    {market.stories} stories · {market.purchases} purchases
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-medium">Top paid items</h2>
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
              {data.topPaid.map((item) => (
                <li key={item.title} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">{item.kind}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatInr(item.gmvInr)}</p>
                    <p className="text-muted-foreground">{item.count} sales</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="mt-8">
            <h2 className="text-lg font-medium">Daily purchases</h2>
            <ul className="mt-3 grid gap-2">
              {data.series.map((row) => (
                <li key={row.date} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-muted-foreground">{row.date.slice(5)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, row.purchases * 25)}%` }}
                    />
                  </span>
                  <span className="w-20 text-right">{row.purchases} · {formatInr(row.gmvInr)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border px-4 py-4">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-2xl font-medium">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-secondary px-4 py-3">
      <dt className="text-xs text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-xl font-medium">{value}</dd>
    </div>
  );
}
