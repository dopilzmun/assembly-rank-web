"use client";

import { useRouter } from "next/navigation";
import LegislativeLiveRadar from "@/components/LegislativeLiveRadar";
import { WeeklyRadarStats } from "@/types/activity";

export default function LiveRadarView({ data }: { data: WeeklyRadarStats }) {
  const router = useRouter();

  return (
    <LegislativeLiveRadar
      data={data}
      onSelectAssemb={(assembId) => {
        router.push(`/?member=${assembId}`);
      }}
    />
  );
}