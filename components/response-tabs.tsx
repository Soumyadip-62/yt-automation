export type ResponseTab = "script" | "metadata" | "scenes" | "assets";

type ResponseTabsProps = {
  activeTab: ResponseTab;
  onTabChange: (tab: ResponseTab) => void;
};

const tabs: Array<{ label: string; value: ResponseTab }> = [
  { label: "📝 Script & Hook", value: "script" },
  { label: "🏷️ Metadata & Tags", value: "metadata" },
  { label: "🎬 Scene Breakdown", value: "scenes" },
  { label: "🛰️ Assets", value: "assets" },
];

export function ResponseTabs({ activeTab, onTabChange }: ResponseTabsProps) {
  return (
    <div className="flex border-b border-slate-800 bg-slate-950/40">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={`flex-1 cursor-pointer border-b-2 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === tab.value
              ? "border-cyan-500 bg-slate-900/90 text-cyan-400"
              : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
