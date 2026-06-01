import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

/**
 * POST /admin/api/suggest-tags
 *
 * Body: { imageUrl: string }
 * Returns: { tags: string[] }
 *
 * Calls the Anthropic Claude API with the photo URL and asks it to suggest
 * relevant photography tags.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let imageUrl: string;
  try {
    const body = await req.json();
    imageUrl = body.imageUrl;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "url",
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: `Look at this photo and suggest 5–10 concise, lowercase photography tags that describe its content, mood, and style.
Rules:
- Tags must be lowercase, hyphen-separated (e.g. "golden-hour", "long-exposure")
- Focus on: subject matter, lighting, landscape/architecture/portrait/street/etc., season, mood
- No generic tags like "photo", "image", "picture"
- Return ONLY a JSON array of strings, nothing else. Example: ["landscape","golden-hour","mountains","fog"]`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${err}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? "[]";

    // Extract JSON array from the response (Claude may add surrounding text)
    const match = content.match(/\[[\s\S]*\]/);
    const tags: string[] = match ? JSON.parse(match[0]) : [];

    return NextResponse.json({ tags });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
