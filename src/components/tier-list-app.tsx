import { TierListEditor } from "@/components/tier-list-editor";
import type { PublicTierListEditorData } from "@/types/public-tier-lists";

interface TierListAppProps {
  initialData?: PublicTierListEditorData;
  warningMessage?: string | null;
}

export function TierListApp({
  initialData,
  warningMessage,
}: TierListAppProps) {
  return (
    <TierListEditor
      mode="local"
      initialData={initialData}
      warningMessage={warningMessage}
    />
  );
}
