export async function readApiResponse<T>(
  response: Response,
): Promise<T & { error?: string }> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as T & { error?: string };
    } catch {
      throw new Error("Server returned malformed JSON.");
    }
  }

  const plainText = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  throw new Error(
    plainText ||
      `Server returned ${response.status} ${response.statusText || "error"}.`,
  );
}
