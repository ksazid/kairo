export type MediaProviderKind = "image-generation" | "video-generation" | "text-to-speech" | "music-generation" | "lip-sync";

export type MediaProviderDefinition = {
  kind: MediaProviderKind;
  title: string;
  provider: string;
  model: string;
  role: string;
  badges: string[];
  fields: Array<{
    label: string;
    value: string;
    type?: "select" | "toggle";
    options?: string[];
    hint?: string;
  }>;
};

export const AI_PROVIDER = {
  name: "Ollama",
  role: "Writing & reasoning",
  capabilities: ["Text generation", "Research assistance", "Recommendations"],
} as const;

export const MEDIA_PROVIDERS: Record<MediaProviderKind, MediaProviderDefinition> = {
  "image-generation": {
    kind: "image-generation",
    title: "Image Generation",
    provider: "Black Forest Labs",
    model: "FLUX.1 Schnell",
    role: "Default image model",
    badges: ["Runs locally", "No external API"],
    fields: [
      { label: "Model", value: "flux-schnell", type: "select", options: ["flux-schnell"] },
      { label: "Quality", value: "Fast", type: "select", options: ["Fast"] },
      { label: "Aspect Ratio", value: "Auto", type: "select", options: ["Auto"] },
    ],
  },
  "video-generation": {
    kind: "video-generation",
    title: "Video Generation",
    provider: "Alibaba",
    model: "Wan 2.2",
    role: "Default video model",
    badges: ["Runs locally", "No external API"],
    fields: [
      { label: "Model", value: "wan-2.2", type: "select", options: ["wan-2.2"] },
      { label: "Resolution", value: "1080p", type: "select", options: ["1080p"] },
      { label: "Frame Rate", value: "30 fps", type: "select", options: ["30 fps"] },
    ],
  },
  "text-to-speech": {
    kind: "text-to-speech",
    title: "Text-to-Speech",
    provider: "hexgrad",
    model: "Kokoro",
    role: "Default TTS engine",
    badges: ["Runs locally", "No external API"],
    fields: [
      { label: "Engine", value: "kokoro", type: "select", options: ["kokoro"] },
      { label: "Default Voice", value: "Heart", type: "select", options: ["Heart"] },
      { label: "Speed", value: "1.0x", type: "select", options: ["1.0x"] },
    ],
  },
  "music-generation": {
    kind: "music-generation",
    title: "Music Generation",
    provider: "ACE Studio",
    model: "ACE-Step",
    role: "Default music model",
    badges: ["Runs locally", "No external API"],
    fields: [
      { label: "Model", value: "ace-step", type: "select", options: ["ace-step"] },
      { label: "Duration", value: "Auto", type: "select", options: ["Auto"] },
      { label: "Instrumental by default", value: "On", type: "toggle", hint: "Generate instrumental music unless a vocal track is explicitly requested." },
    ],
  },
  "lip-sync": {
    kind: "lip-sync",
    title: "Lip-sync",
    provider: "Tencent Music",
    model: "MuseTalk",
    role: "Default lip-sync model",
    badges: ["Runs locally", "No external API"],
    fields: [
      { label: "Model", value: "musetalk", type: "select", options: ["musetalk"] },
      { label: "Quality", value: "Standard", type: "select", options: ["Standard"] },
      { label: "Output Resolution", value: "Match source", type: "select", options: ["Match source"] },
    ],
  },
};

export const PRIMARY_MEDIA_KINDS: MediaProviderKind[] = ["image-generation", "video-generation"];
export const SECONDARY_MEDIA_KINDS: MediaProviderKind[] = ["text-to-speech", "music-generation", "lip-sync"];
