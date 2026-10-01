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
        <h1 className="font-display text-3xl">My trips</h1>
        <LoginGateButton
          className="text-sm font-medium text-primary"
          title="Sign in to create a trip"
          body="Sign in to start planning your next destination on Travelhues."
        >
          New trip
        </LoginGateButton>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        A trip is one place. Add the spots you want, then line them up into an itinerary.
      </p>
      <p className="pt-8 text-sm text-muted-foreground">
        No trips yet. Sign in to create your first one.
      </p>
    </div>
  );
}
