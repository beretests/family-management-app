export function calculateReviewPoints({
  pointsPossible,
  rejectionCount,
}: {
  pointsPossible: number;
  rejectionCount: number;
}) {
  if (pointsPossible <= 0) {
    return 0;
  }

  if (rejectionCount <= 0) {
    return pointsPossible;
  }

  return Math.max(1, Math.floor(pointsPossible * 0.75));
}

export function pointsReviewNote({
  pointsAwarded,
  taskTitle,
}: {
  pointsAwarded: number;
  taskTitle: string;
}) {
  return `${taskTitle} approved for ${pointsAwarded} point${
    pointsAwarded === 1 ? "" : "s"
  }.`;
}
