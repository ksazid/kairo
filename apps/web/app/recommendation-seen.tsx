"use client";

import { useEffect } from "react";
import { recordSeenAction } from "./opportunity-actions";

export function RecommendationSeen({ brandId, opportunityId }: { brandId: string; opportunityId: string }) {
  useEffect(() => {
    void recordSeenAction(brandId, opportunityId);
  }, [brandId, opportunityId]);
  return null;
}
