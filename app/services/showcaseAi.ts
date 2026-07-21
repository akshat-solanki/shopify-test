import { studioAiResultSchema, type StudioAiResult } from "../lib/studio-ai";
import type { StudioSettings } from "../lib/studio-settings";

export async function generateShowcaseConfig(prompt: string, currentSettings: StudioSettings): Promise<StudioAiResult> {
  const response = await fetch("/api/ai/showcase-config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      currentSettings,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `AI request failed with ${response.status}`;
    throw new Error(message);
  }

  return studioAiResultSchema.parse(payload);
}
