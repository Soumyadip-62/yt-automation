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
    <div className="flex border-b border-slate-200 bg-slate-50/20">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={`flex-1 cursor-pointer border-b-2 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === tab.value
              ? "border-cyan-600 bg-white text-cyan-700"
              : "border-transparent text-slate-500 hover:bg-slate-50/50 hover:text-slate-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
