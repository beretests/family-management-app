import { ReviewCard } from "@/components/reviews/review-card";
import type { ReviewQueueItem } from "@/features/reviews/types";

export function ReviewQueue({
  familyId,
  items,
}: {
  familyId: string;
  items: ReviewQueueItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
        No chores are waiting for review.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <ReviewCard familyId={familyId} item={item} key={item.id} />
      ))}
    </div>
  );
}
