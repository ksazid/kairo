import { MEDIA_PROVIDERS } from "../../provider-catalog";
import { ProviderManagementPage } from "../../provider-management-page";

export default function VideoGenerationProviderPage() {
  return <ProviderManagementPage definition={MEDIA_PROVIDERS["video-generation"]} />;
}
