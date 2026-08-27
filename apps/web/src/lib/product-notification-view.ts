export type ProductNotificationRecord = {
  id: string;
  kind: string;
  occurredAt: string;
  context: {
    campaignId?: string;
    assetId?: string;
    channel?: string;
    accountRef?: string;
    failureReason?: string;
  };
  brandId: string;
};

export type ProductNotificationView = {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  href: string;
  unread: boolean;
};

export function productNotificationView(item: ProductNotificationRecord): ProductNotificationView {
  const base = `/brands/${encodeURIComponent(item.brandId)}`;
  const contentHref = `${base}/content`;

  if (item.kind === "publishing-failed") {
    return {
      id: item.id,
      title: "Publishing failed",
      detail: item.context.failureReason ?? "Open Content to review the failed publish.",
      occurredAt: friendlyOccurredAt(item.occurredAt),
      href: contentHref,
      unread: true,
    };
  }

  if (item.kind === "connection-reconnect-required") {
    const href = item.context.channel === "instagram"
      ? `${base}/channels/instagram/connect?returnTo=${encodeURIComponent(`${base}/brain`)}`
      : `${base}/brain`;
    return {
      id: item.id,
      title: `${item.context.channel ?? "Channel"} needs reconnection`,
      detail: item.context.accountRef ?? "Reconnect the publishing destination.",
      occurredAt: friendlyOccurredAt(item.occurredAt),
      href,
      unread: true,
    };
  }

  if (item.kind.startsWith("performance-") || item.kind === "strong-performance") {
    return {
      id: item.id,
      title: "New performance insight",
      detail: "Open Insights to review the latest measured signal.",
      occurredAt: friendlyOccurredAt(item.occurredAt),
      href: `${base}/performance`,
      unread: true,
    };
  }

  return {
    id: item.id,
    title: "Content ready for approval",
    detail: "A reviewed asset is waiting for your decision.",
    occurredAt: friendlyOccurredAt(item.occurredAt),
    href: contentHref,
    unread: true,
  };
}

function friendlyOccurredAt(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : value;
}
