"use client";

import Image from "next/image";

import { LoginGateButton } from "@/components/login-prompt";

export function GuestTrips() {
  return (
    <div className="h-full overflow-y-auto px-5 pt-6 pb-10">
      <div className="mb-5 flex justify-center">
        <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-12 w-fit" />
      </div>
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl">My plans</h1>
        <LoginGateButton
          className="text-sm font-medium text-primary"
          title="Sign in to create a plan"
          body="Sign in to start planning your next destination on Travelhues."
        >
          New plan
        </LoginGateButton>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        A plan is one place. Add the finds you want, then line them up into an itinerary.
      </p>
      <p className="pt-8 text-sm text-muted-foreground">
        No plans yet. Sign in to create your first one.
      </p>
    </div>
  );
}
