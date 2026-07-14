type CopyButtonProps = {
  copied: boolean;
  copiedLabel?: string;
  label: string;
  onClick: () => void;
  showIcon?: boolean;
};

export function CopyButton({
  copied,
  copiedLabel = "Copied!",
  label,
  onClick,
  showIcon = false,
}: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
    >
      {copied ? (
        <>
          {showIcon ? (
            <svg
              className="h-3.5 w-3.5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : null}
          <span className="font-semibold text-emerald-700">{copiedLabel}</span>
        </>
      ) : (
        <>
          {showIcon ? (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          ) : null}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
