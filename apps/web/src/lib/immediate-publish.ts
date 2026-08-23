export type ImmediatePublishContentType = "text" | "image" | "video" | "carousel";

export function immediatePublishContentType(
  channel: string,
  capabilities: readonly string[],
): ImmediatePublishContentType | null {
  if (channel === "linkedin" && capabilities.includes("text")) return "text";
  if (channel === "instagram" && capabilities.includes("carousel")) return "carousel";
  return null;
}
