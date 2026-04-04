"use client";

import { DashboardPanel } from "@/app/dashboard/_components/dashboard-panel";
import type { DashboardPanelProps } from "@/app/dashboard/_components/dashboard-panel.types";

export function TierListsDashboardClient(props: DashboardPanelProps) {
  return <DashboardPanel {...props} />;
}
