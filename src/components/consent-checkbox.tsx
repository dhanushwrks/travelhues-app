"use client";

import Link from "next/link";

export const consentRequiredMessage = "Agree to the Terms and Privacy Policy to continue";

export function ConsentCheckbox({
  checked,
  onChange,
  id = "legal-consent",
  required = true,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-left text-sm leading-6">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        required={required}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 accent-primary"
      />
      <span className="text-muted-foreground">
        I agree to the{" "}
        <Link
          href="/terms"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={(event) => event.stopPropagation()}
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={(event) => event.stopPropagation()}
        >
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
