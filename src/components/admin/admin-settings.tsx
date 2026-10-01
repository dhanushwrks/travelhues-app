"use client";

import { useEffect, useState } from "react";

import { Loader, PageLoader } from "@/components/loader";
import { fetchAdminSettings, saveAdminSettings } from "@/lib/admin-api";
import type { AdminSettings } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";
import { countryFlag, countryName } from "@/lib/countries";

const MARKET_OPTIONS = ["TH", "IN", "VN", "ID", "LK", "NP", "JP", "KR"];

export function AdminSettingsPage({
  section = "all",
}: {
  section?: "all" | "markets" | "brand" | "defaults" | "moderation";
}) {
  const token = readCookie("th_access");
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchAdminSettings(token)
      .then(setSettings)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load settings"));
  }, [token]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const next = await saveAdminSettings(token, settings);
      setSettings(next);
      setNotice("Settings saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (error && !settings) return <p className="px-5 pt-8 text-sm text-primary">{error}</p>;
  if (!settings) return <PageLoader label="Loading settings" />;

  const showMarkets = section === "all" || section === "markets";
  const showBrand = section === "all" || section === "brand";
  const showDefaults = section === "all" || section === "defaults";
  const showModeration = section === "all" || section === "moderation";

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Markets, brand links, commerce and moderation policy.</p>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}

      {showMarkets ? (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Markets</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enabled countries appear in Explore.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {MARKET_OPTIONS.map((code) => {
              const checked = settings.enabledCountries.includes(code);
              return (
                <li key={code}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setSettings({
                          ...settings,
                          enabledCountries: event.target.checked
                            ? [...settings.enabledCountries, code]
                            : settings.enabledCountries.filter((item) => item !== code),
                        });
                      }}
                    />
                    <span>
                      {countryFlag(code)} {countryName(code)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {showBrand ? (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Brand links</h2>
          <div className="mt-4 grid gap-3">
            {(
              [
                ["instagramUrl", "Instagram"],
                ["linkedinUrl", "LinkedIn"],
                ["youtubeUrl", "YouTube"],
                ["termsUrl", "Terms"],
                ["policiesUrl", "Policies"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-1.5 text-sm">
                <span className="font-medium">{label}</span>
                <input
                  value={settings.brand[key]}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      brand: { ...settings.brand, [key]: event.target.value },
                    })
                  }
                  className="h-11 rounded-xl border border-border bg-background px-3"
                />
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {showDefaults ? (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Commerce defaults</h2>
          <label className="mt-4 grid max-w-xs gap-1.5 text-sm">
            <span className="font-medium">Default purchase price (INR)</span>
            <input
              type="number"
              min={1}
              value={settings.defaults.priceInr}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  defaults: { priceInr: Number(event.target.value) || 99 },
                })
              }
              className="h-11 rounded-xl border border-border bg-background px-3"
            />
          </label>
        </section>
      ) : null}

      {showModeration ? (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Moderation policy</h2>
          <div className="mt-4 grid gap-4">
            <label className="grid max-w-xs gap-1.5 text-sm">
              <span className="font-medium">Report SLA (hours)</span>
              <input
                type="number"
                min={1}
                value={settings.moderation.reportSlaHours}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    moderation: {
                      ...settings.moderation,
                      reportSlaHours: Number(event.target.value) || 48,
                    },
                  })
                }
                className="h-11 rounded-xl border border-border bg-background px-3"
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.moderation.autoUnpublishOnCopyright}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    moderation: {
                      ...settings.moderation,
                      autoUnpublishOnCopyright: event.target.checked,
                    },
                  })
                }
              />
              Auto-unpublish when a copyright claim is received
            </label>
            <label className="grid max-w-md gap-1.5 text-sm">
              <span className="font-medium">Appeal contact email</span>
              <input
                type="email"
                value={settings.moderation.appealContactEmail}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    moderation: {
                      ...settings.moderation,
                      appealContactEmail: event.target.value,
                    },
                  })
                }
                className="h-11 rounded-xl border border-border bg-background px-3"
              />
            </label>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-8 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {saving ? <Loader label="Saving" /> : "Save settings"}
      </button>
    </div>
  );
}
