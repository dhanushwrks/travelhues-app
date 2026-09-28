"use client";

import { useRouter } from "next/navigation";

import { clearSession } from "@/lib/browser-session";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="justify-self-start text-sm"
      onClick={() => {
        clearSession();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
