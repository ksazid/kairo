import { MEDIA_PROVIDERS } from "../../provider-catalog";
import { ProviderManagementPage } from "../../provider-management-page";

export default function MusicGenerationProviderPage() {
  return <ProviderManagementPage definition={MEDIA_PROVIDERS["music-generation"]} />;
}
