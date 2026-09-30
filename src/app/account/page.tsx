import { AccountSettings } from "@/components/account-settings";
import { ProfileView } from "@/components/profile-view";
import { TravelerProfile } from "@/components/traveler-profile";
import { emptyLibrary } from "@/lib/marks";
import { loadLibrary, loadMe } from "@/lib/remote";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await requireSession();
  const person = await loadMe(session.token);
  if (!person) redirect("/login");

  if (session.role === "traveler") {
    const library = (await loadLibrary(session.token)) ?? emptyLibrary;
    return <TravelerProfile person={person} library={library} />;
  }

  return (
    <ProfileView person={person} editHref="/account/edit">
      <AccountSettings hidden={person.hidden} hasPassword={person.hasPassword !== false} />
    </ProfileView>
  );
}
