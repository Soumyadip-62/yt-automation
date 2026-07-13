"use client";

import { FormEvent, useState } from "react";
import { ScriptResponse } from "@/lib/gemini";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [scriptData, setScriptData] = useState<ScriptResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"script" | "metadata" | "scenes">("script");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError("Enter a topic first.");
      setScriptData(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setScriptData(null);

    try {
      const response = await fetch("/api/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: trimmedTopic }),
      });

      const data = (await response.json()) as ScriptResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Script generation failed.");
      }

      if (data.script && data.metadata && data.scenebreakdown) {
        setScriptData(data);
        setActiveTab("script"); // Reset tab to first one on new generation
      } else {
        throw new Error("Invalid response format received from server.");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Script generation failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">
              YT Automate
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
              AI script generation
            </h1>
          </div>
          <div className="hidden rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm sm:block">
            Shorts ready
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleSubmit}
            className="flex h-fit flex-col gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <label
                htmlFor="topic"
                className="text-sm font-semibold text-slate-800"
              >
                Video topic
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Black holes, moon landing myths, AI tools for creators..."
                className="mt-3 min-h-36 w-full resize-none rounded-md border border-slate-300 bg-white px-4 py-3 text-base leading-7 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-md bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400 cursor-pointer"
            >
              {isLoading ? "Generating..." : "Generate script"}
            </button>
          </form>

          <section
            aria-live="polite"
            className="flex min-h-[520px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/50">
              <h2 className="text-lg font-semibold">Generated response</h2>
              <span className="rounded-md bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700 border border-cyan-100">
                Gemini
              </span>
            </div>

            {scriptData ? (
              <div className="flex flex-col flex-1">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50/20">
                  <button
                    type="button"
                    onClick={() => setActiveTab("script")}
                    className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
                      activeTab === "script"
                        ? "border-cyan-600 text-cyan-700 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                    }`}
                  >
                    📝 Script & Hook
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("metadata")}
                    className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
                      activeTab === "metadata"
                        ? "border-cyan-600 text-cyan-700 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                    }`}
                  >
                    🏷️ Metadata & Tags
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("scenes")}
                    className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
                      activeTab === "scenes"
                        ? "border-cyan-600 text-cyan-700 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                    }`}
                  >
                    🎬 Scene Breakdown
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 bg-white">
                  {activeTab === "script" && (
                    <div className="flex flex-col gap-6 p-5">
                      {/* Hook Section */}
                      {scriptData.scenebreakdown?.hook && (
                        <div className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-800">
                            Hook Sentence
                          </h3>
                          <p className="mt-2 text-base font-semibold text-cyan-950">
                            "{scriptData.scenebreakdown.hook}"
                          </p>
                        </div>
                      )}

                      {/* Narration Script */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-slate-700">Narration Script</h3>
                          <button
                            onClick={() => copyToClipboard(scriptData.script, "script")}
                            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
                          >
                            {copiedField === "script" ? (
                              <>
                                <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-emerald-700 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                <span>Copy Script</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="rounded-lg bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-100 whitespace-pre-wrap select-all">
                          {scriptData.script}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "metadata" && (
                    <div className="flex flex-col gap-6 p-5">
                      {/* Title */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-700">Video Title</h3>
                          <button
                            onClick={() => copyToClipboard(scriptData.metadata.title, "title")}
                            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          >
                            {copiedField === "title" ? (
                              <span className="text-emerald-700 font-semibold">Copied!</span>
                            ) : (
                              "Copy Title"
                            )}
                          </button>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-900">
                          {scriptData.metadata.title || "No title generated"}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-700">Video Description</h3>
                          <button
                            onClick={() => copyToClipboard(scriptData.metadata.description, "description")}
                            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          >
                            {copiedField === "description" ? (
                              <span className="text-emerald-700 font-semibold">Copied!</span>
                            ) : (
                              "Copy Description"
                            )}
                          </button>
                        </div>
                        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                          {scriptData.metadata.description || "No description generated"}
                        </p>
                      </div>

                      {/* Hashtags */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-700">Hashtags</h3>
                          <button
                            onClick={() => copyToClipboard(scriptData.metadata.hashtags.join(" "), "hashtags")}
                            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          >
                            {copiedField === "hashtags" ? (
                              <span className="text-emerald-700 font-semibold">Copied All!</span>
                            ) : (
                              "Copy All Tags"
                            )}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-4">
                          {scriptData.metadata.hashtags && scriptData.metadata.hashtags.length > 0 ? (
                            scriptData.metadata.hashtags.map((tag, idx) => (
                              <button
                                key={idx}
                                onClick={() => copyToClipboard(tag, `tag-${idx}`)}
                                className="rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs font-medium text-cyan-800 transition hover:bg-cyan-100 hover:border-cyan-300 cursor-pointer"
                                title="Click to copy this hashtag"
                              >
                                {tag} {copiedField === `tag-${idx}` ? "✓" : ""}
                              </button>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400">No hashtags generated</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "scenes" && (
                    <div className="flex flex-col gap-6 p-5">
                      {/* Title / Hook Header */}
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-md font-semibold text-slate-900">
                          {scriptData.scenebreakdown.title || "Scene Breakdown"}
                        </h3>
                        {scriptData.scenebreakdown.hook && (
                          <p className="mt-1 text-sm text-slate-500 italic">
                            Hook: "{scriptData.scenebreakdown.hook}"
                          </p>
                        )}
                      </div>

                      {/* Vertical Timeline */}
                      <div className="relative border-l-2 border-slate-200 pl-6 ml-3 flex flex-col gap-8 py-2">
                        {scriptData.scenebreakdown.scenes && scriptData.scenebreakdown.scenes.length > 0 ? (
                          scriptData.scenebreakdown.scenes.map((scene, idx) => (
                            <div key={idx} className="relative group">
                              {/* Bullet Node */}
                              <div className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-cyan-600 bg-white text-[10px] font-bold text-cyan-700 shadow-sm transition-all group-hover:bg-cyan-600 group-hover:text-white">
                                {idx + 1}
                              </div>

                              {/* Scene Card */}
                              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-slate-50">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2 mb-3">
                                  <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">
                                    ⏱️ {scene.duration}s
                                  </span>
                                  {scene.animation && (
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                      🎬 {scene.animation}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-col gap-3">
                                  {/* Narration */}
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                      Narration
                                    </h4>
                                    <p className="mt-1 text-sm font-medium text-slate-900 leading-relaxed">
                                      {scene.narration}
                                    </p>
                                  </div>

                                  {/* Visual Asset Prompt */}
                                  {scene.asset && (
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                          Visual Asset
                                        </h4>
                                        <span className="rounded bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-700">
                                          {scene.asset.type}
                                        </span>
                                      </div>
                                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed italic bg-white border border-slate-200/50 rounded p-2">
                                        {scene.asset.query}
                                      </p>
                                    </div>
                                  )}

                                  {/* Text Overlay / Caption */}
                                  {scene.caption && (
                                    <div>
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        On-screen Caption
                                      </h4>
                                      <p className="mt-1 text-xs font-bold text-cyan-800 uppercase tracking-wide bg-cyan-50 border border-cyan-100 rounded px-2.5 py-1 w-fit">
                                        {scene.caption}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">No scenes generated.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 p-5">
                <div className="flex w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  {isLoading
                    ? "Generating script..."
                    : "Enter a topic and generate your YouTube Shorts script."}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
