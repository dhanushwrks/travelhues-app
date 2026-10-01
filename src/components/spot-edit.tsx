"use client";

import { useState } from "react";

import { ArchiveAction } from "@/components/archive-action";
import { BackLink } from "@/components/back-link";
import { Loader, PageLoader } from "@/components/loader";
import { PurchaseAccessFields } from "@/components/purchase-access-fields";
import { updateDeskSpot, useDesk, useDeskHome } from "@/lib/studio-desk";

/** Find field editing is limited — Archive/Restore and purchase access live here. */
export function SpotEdit({ storyId, spotId }: { storyId: string; spotId: string }) {
  const home = useDeskHome();
  const { stories, status, problem } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const find = story?.spots.find((item) => item.id === spotId);
  const back = `${home}/${storyId}/spots/${spotId}`;
  const [purchaseOnly, setPurchaseOnly] = useState<boolean | null>(null);
  const [priceInr, setPriceInr] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!story && status !== "ready") {
    return (
      <div className="px-5 pt-6">
        <PageLoader label="Loading the find" />
      </div>
    );
  }
  if (status === "error") {
    return <p className="px-5 pt-6 text-sm text-primary">{problem}</p>;
  }
  if (!story || !find) {
    return (
      <div className="px-5 pt-6">
        <BackLink href={`${home}/${storyId}?tab=spots`} />
        <p className="pt-6 text-sm text-muted-foreground">That find is not in this story.</p>
      </div>
    );
  }

  const only = purchaseOnly ?? find.purchaseOnly ?? false;
  const price = priceInr ?? find.priceInr ?? 99;

  async function savePurchase() {
    setSaving(true);
    setError("");
    try {
      await updateDeskSpot(storyId, spotId, {
        ...find!,
        purchaseOnly: only,
        priceInr: only ? price : 99,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update purchase settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid h-full gap-5 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <BackLink href={back} />
        <h1 className="truncate text-lg font-medium">Edit find</h1>
      </div>
      <p className="text-sm text-muted-foreground">{find.title}</p>
      <PurchaseAccessFields
        purchaseOnly={only}
        priceInr={price}
        onPurchaseOnlyChange={setPurchaseOnly}
        onPriceChange={setPriceInr}
      />
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => void savePurchase()}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {saving ? <Loader label="Saving" /> : "Save purchase settings"}
      </button>
      <ArchiveAction
        storyId={storyId}
        kind="spots"
        itemId={spotId}
        archived={find.archived ?? false}
      />
    </div>
  );
}
