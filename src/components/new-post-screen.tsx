"use client";

import { useRouter } from "next/navigation";

import { PostForm } from "@/components/storefront-create";

export function NewPostScreen() {
  const router = useRouter();
  return (
    <PostForm
      onClose={() => router.push("/storefront")}
      onPosted={() => {
        router.push("/storefront");
        router.refresh();
      }}
    />
  );
}
