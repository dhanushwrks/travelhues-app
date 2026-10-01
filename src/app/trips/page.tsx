import { redirect } from "next/navigation";

import { GuestTrips } from "@/components/guest-trips";
import { StudioHome } from "@/components/studio-home";
import { DeskScope } from "@/lib/studio-desk";
import { getSession } from "@/lib/session";

export default async function TripsPage() {
  const session = await getSession();
  if (!session) return <GuestTrips />;
  if (session.role !== "traveler") redirect("/");
  return (
    <DeskScope home="/trips">
      <StudioHome
        title="My trips"
        lead="A trip is one place. Add the spots you want, then line them up into an itinerary."
        action="New trip"
        empty="No trips yet. Start with the place you want to go."
        loading="Loading your trips"
      />
    </DeskScope>
  );
}
