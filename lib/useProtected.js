"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

export function useProtected() {
  const { user, ready } = useApp();
  const router = useRouter();
  if (ready && !user) {
    if (typeof window !== "undefined") router.replace("/");
    return false;
  }
  return !!user;
}
