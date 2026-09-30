import { ProfileAvatar } from "@/components/profile-avatar";

export function ProfileMast({
  name,
  cover,
  avatar,
  coverSlot,
  avatarSlot,
  introVideoUrl,
  className = "",
}: {
  name: string;
  cover?: React.ReactNode;
  avatar?: React.ReactNode;
  coverSlot?: React.ReactNode;
  avatarSlot?: React.ReactNode;
  introVideoUrl?: string;
  className?: string;
}) {
  return (
    <div className={`relative mt-4 pb-14 ${className}`}>
      <div className="relative h-48 overflow-hidden rounded-[1.75rem] bg-secondary md:h-64">
        {cover}
      </div>
      {coverSlot ? <div className="absolute top-3 right-3 z-20">{coverSlot}</div> : null}
      <ProfileAvatar name={name} avatar={avatar} introVideoUrl={introVideoUrl} avatarSlot={avatarSlot} />
    </div>
  );
}
