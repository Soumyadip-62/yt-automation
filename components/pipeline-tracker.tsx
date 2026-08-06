"use client";

import { Check, Clock, LoaderCircle } from "lucide-react";

export type PipelineStepId = "script" | "scenes" | "assets" | "voice" | "render" | "upload";

export type StepStatus = "pending" | "in-progress" | "completed" | "disabled";

export type PipelineStep = {
  id: PipelineStepId;
  label: string;
  status: StepStatus;
};

type PipelineTrackerProps = {
  steps: PipelineStep[];
  currentStep?: PipelineStepId;
  onStepClick?: (stepId: PipelineStepId) => void;
};

export function PipelineTracker({ steps, onStepClick }: PipelineTrackerProps) {
  return (
    <div className="flex w-full items-center justify-between gap-1.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 shadow-lg backdrop-blur-md">
      {steps.map((step, index) => {
        const isCompleted = step.status === "completed";
        const isInProgress = step.status === "in-progress";
        const isPending = step.status === "pending";

        return (
          <div key={step.id} className="flex flex-1 items-center gap-1.5 min-w-[110px]">
            <button
              type="button"
              disabled={step.status === "disabled" || !onStepClick}
              onClick={() => onStepClick?.(step.id)}
              className={`group flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isCompleted
                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40"
                  : isInProgress
                    ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 ring-2 ring-cyan-500/30"
                    : isPending
                      ? "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
                      : "border-slate-800/40 bg-slate-950/30 text-slate-600 cursor-not-allowed"
              }`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isCompleted
                    ? "bg-emerald-500 text-slate-950"
                    : isInProgress
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <Check size={12} strokeWidth={3} />
                ) : isInProgress ? (
                  <LoaderCircle size={12} className="animate-spin" />
                ) : (
                  index + 1
                )}
              </span>

              <span className="truncate">{step.label}</span>

              {isPending && (
                <Clock size={11} className="ml-auto opacity-40 shrink-0" />
              )}
            </button>

            {index < steps.length - 1 && (
              <span className="h-px w-2 shrink-0 bg-slate-800 hidden sm:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}
