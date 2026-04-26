"use client";

import { TabBar, type TabKey } from "@/components/TabBar";

type Props = {
  currentTab: TabKey;
  onTabChange: (key: TabKey) => void;
};

export function AppFooter({ currentTab, onTabChange }: Props) {
  return <TabBar current={currentTab} onChange={onTabChange} />;
}
