"use client";

import { useState } from "react";
import { WeeklyRadarStats } from "@/types/activity";
import { BillRankingRow } from "@/types/ranking";
import LegislativeLiveRadar from "@/components/LegislativeLiveRadar";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";

interface LiveInteractiveSectionProps {
  data: WeeklyRadarStats;
  allMembers: BillRankingRow[];
}

export default function LiveInteractiveSection({ data, allMembers }: LiveInteractiveSectionProps) {
  const [selectedAssemb, setSelectedAssemb] = useState<BillRankingRow | null>(null);

  const handleSelectAssembById = (assembId: string) => {
    const target = allMembers.find((m) => m.assemb_id === assembId);
    if (target) {
      setSelectedAssemb(target);
    }
  };

  return (
    <>
      <LegislativeLiveRadar
        data={data}
        onSelectAssemb={handleSelectAssembById}
      />

      {/* 라이브 탭 내부에서 즉시 열리는 의원 상세 Drawer */}
      <AssembDetailDrawer
        assemb={selectedAssemb}
        onClose={() => setSelectedAssemb(null)}
      />
    </>
  );
}