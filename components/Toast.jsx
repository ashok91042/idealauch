"use client";
import { useApp } from "@/lib/store";

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-[22px] left-1/2 -translate-x-1/2 bg-brand text-white font-extrabold px-6 py-3 rounded-full z-[99] shadow-card">
      {toast}
    </div>
  );
}
