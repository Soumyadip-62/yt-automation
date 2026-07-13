"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError("Enter a topic first.");
      setScript("");
      return;
    }

    setIsLoading(true);
    setError("");
    setScript("");

    try {
      const response = await fetch("/api/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: trimmedTopic }),
      });

      const data = (await response.json()) as {
        script?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Script generation failed.");
      }

      setScript(data.script ?? "");
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
              className="h-12 rounded-md bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? "Generating..." : "Generate script"}
            </button>
          </form>

          <section
            aria-live="polite"
            className="flex min-h-[520px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Generated response</h2>
              <span className="rounded-md bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
                Gemini
              </span>
            </div>

            <div className="flex flex-1 p-5">
              {script ? (
                <pre className="w-full whitespace-pre-wrap rounded-md bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-100">
                  {script}
                </pre>
              ) : (
                <div className="flex w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  {isLoading
                    ? "Generating script..."
                    : "Enter a topic and generate your YouTube Shorts script."}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
