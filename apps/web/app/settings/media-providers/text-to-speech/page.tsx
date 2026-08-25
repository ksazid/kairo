import { MEDIA_PROVIDERS } from "../../provider-catalog";
import { ProviderManagementPage } from "../../provider-management-page";

export default function TextToSpeechProviderPage() {
  return <ProviderManagementPage definition={MEDIA_PROVIDERS["text-to-speech"]} />;
}
