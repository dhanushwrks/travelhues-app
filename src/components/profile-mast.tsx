export function ProfileMast({
  name,
  cover,
  avatar,
  coverSlot,
  avatarSlot,
  className = "",
}: {
  name: string;
  cover?: React.ReactNode;
  avatar?: React.ReactNode;
  coverSlot?: React.ReactNode;
  avatarSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative mt-4 pb-14 ${className}`}>
      <div className="relative h-48 overflow-hidden rounded-[1.75rem] bg-secondary md:h-64">
        {cover}
      </div>
      {coverSlot ? <div className="absolute top-3 right-3 z-20">{coverSlot}</div> : null}
      <div className="absolute bottom-0 left-4 z-10 size-28">
        <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-[5px] border-card bg-secondary font-display text-3xl">
          {avatar ?? name.slice(0, 1)}
        </span>
        {avatarSlot}
      </div>
    </div>
  );
}
