import { MEDIA_PROVIDERS } from "../../provider-catalog";
import { ProviderManagementPage } from "../../provider-management-page";

export default function ImageGenerationProviderPage() {
  return <ProviderManagementPage definition={MEDIA_PROVIDERS["image-generation"]} />;
}
