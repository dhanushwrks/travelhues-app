import { redirect } from "next/navigation";

import { EditProfileForm } from "@/components/edit-profile-form";
import { loadMe } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function EditAccountPage() {
  const session = await requireSession();
  const person = await loadMe(session.token);
  if (!person) redirect("/login");
  return (
    <div className="h-full overflow-y-auto">
      <EditProfileForm person={person} />
    </div>
  );
}
