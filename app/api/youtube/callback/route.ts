import { NextResponse } from "next/server";
import { exchangeYoutubeCode } from "@/lib/youtube";

export const runtime = "nodejs";

function html(message: string) {
  const escapedMessage = message.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );

  return `<!doctype html>
<html>
  <head>
    <title>YouTube connected</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f1f5f9; color: #0f172a; }
      main { max-width: 520px; padding: 32px; background: white; border: 1px solid #e2e8f0; }
      p { color: #475569; line-height: 1.6; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapedMessage}</h1>
      <p>You can return to the video editor and click upload again.</p>
    </main>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new NextResponse(html("YouTube connection was cancelled."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  if (!code) {
    return new NextResponse(html("Missing YouTube authorization code."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  try {
    const tokens = await exchangeYoutubeCode({ code, origin: url.origin });
    const response = new NextResponse(html("YouTube connected."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

    response.cookies.set("youtube_access_token", tokens.access_token ?? "", {
      httpOnly: true,
      maxAge: tokens.expires_in ?? 3600,
      sameSite: "lax",
      secure: url.protocol === "https:",
    });

    if (tokens.refresh_token) {
      response.cookies.set("youtube_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        secure: url.protocol === "https:",
      });
    }

    return response;
  } catch (authError) {
    return new NextResponse(
      html(
        authError instanceof Error
          ? authError.message
          : "Could not connect YouTube.",
      ),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 500,
      },
    );
  }
}
