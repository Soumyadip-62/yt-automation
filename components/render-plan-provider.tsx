"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import type { RenderPlan } from "@/types/render-plan";

type RenderPlanContextValue = {
  renderPlan: RenderPlan | null;
  setRenderPlan: (plan: RenderPlan | null) => void;
};

const RenderPlanContext = createContext<RenderPlanContextValue | null>(null);

export function RenderPlanProvider({ children }: { children: ReactNode }) {
  const [renderPlan, setRenderPlan] = useState<RenderPlan | null>(null);
  const value = useMemo(
    () => ({ renderPlan, setRenderPlan }),
    [renderPlan],
  );

  return (
    <RenderPlanContext.Provider value={value}>
      {children}
    </RenderPlanContext.Provider>
  );
}

export function useRenderPlan() {
  const context = useContext(RenderPlanContext);

  if (!context) {
    throw new Error("useRenderPlan must be used inside RenderPlanProvider.");
  }

  return context;
}

