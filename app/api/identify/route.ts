import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl, imageBase64, mimeType } = await request.json();

  const imageSource = imageBase64
    ? { type: "base64" as const, media_type: mimeType as "image/jpeg" | "image/png" | "image/webp", data: imageBase64 }
    : { type: "url" as const, url: imageUrl };

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: imageSource },
          {
            type: "text",
            text: `Identify this item and respond ONLY with a JSON object (no markdown, no explanation):
{
  "name": "full product name",
  "category": "e.g. Electronics, Clothing, Tools, Books, Furniture, Collectibles, Sports, Other",
  "description": "2-3 sentence description for an eBay listing",
  "condition": "New | Like New | Good | Fair | Poor",
  "brand": "brand name or empty string",
  "model": "model name/number or empty string",
  "color": "primary color(s) or empty string",
  "material": "primary material(s) or empty string",
  "size": "size if applicable or empty string",
  "estimatedValue": number in USD or 0
}`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  }

  const result = JSON.parse(jsonMatch[0]);
  return NextResponse.json(result);
}
