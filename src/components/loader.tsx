export function Loader({ label, className = "size-4" }: { label?: string; className?: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2" role="status">
      <span
        className={`${className} motion-safe:animate-spin rounded-full border-2 border-current border-t-transparent`}
        aria-hidden
      />
      {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}

export function PageLoader({ label }: { label: string }) {
  return (
    <div className="grid min-h-40 place-items-center gap-3 px-5 py-10 text-sm text-muted-foreground">
      <Loader label={label} className="size-6 text-primary" />
    </div>
  );
}
