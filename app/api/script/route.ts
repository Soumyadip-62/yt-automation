import { generateScript } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { topic?: unknown };
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";

    if (!topic) {
      return Response.json({ error: "Topic is required." }, { status: 400 });
    }

    if (topic.length > 200) {
      return Response.json(
        { error: "Topic must be 200 characters or fewer." },
        { status: 400 },
      );
    }

    const script = await generateScript(topic);

    return Response.json({ script });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Unable to generate script right now." },
      { status: 500 },
    );
  }
}
