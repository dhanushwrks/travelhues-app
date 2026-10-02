import { AccountSettings } from "@/components/account-settings";
import { ProfileView } from "@/components/profile-view";
import { TravelerProfile } from "@/components/traveler-profile";
import { emptyLibrary } from "@/lib/marks";
import { loadLibrary, loadMe } from "@/lib/remote";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await requireSession();
  const [person, library] = await Promise.all([
    loadMe(session.token),
    loadLibrary(session.token),
  ]);
  if (!person) redirect("/login");

  if (session.role === "traveler") {
    return <TravelerProfile person={person} library={library ?? emptyLibrary} />;
  }

  return (
    <ProfileView person={person} editHref="/account/edit">
      <AccountSettings hidden={person.hidden} hasPassword={person.hasPassword !== false} />
    </ProfileView>
  );
}
