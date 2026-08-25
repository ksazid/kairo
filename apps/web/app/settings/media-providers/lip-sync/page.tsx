import { MEDIA_PROVIDERS } from "../../provider-catalog";
import { ProviderManagementPage } from "../../provider-management-page";

export default function LipSyncProviderPage() {
  return <ProviderManagementPage definition={MEDIA_PROVIDERS["lip-sync"]} />;
}
