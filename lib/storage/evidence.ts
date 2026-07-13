export const TASK_EVIDENCE_BUCKET = "task-evidence";
export const MAX_EVIDENCE_FILE_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_RETENTION_DAYS = 30;

export const allowedEvidenceContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedEvidenceContentType =
  (typeof allowedEvidenceContentTypes)[number];

const extensionByContentType: Record<AllowedEvidenceContentType, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedEvidenceContentType(
  value: string,
): value is AllowedEvidenceContentType {
  return allowedEvidenceContentTypes.includes(
    value as AllowedEvidenceContentType,
  );
}

export function validateEvidenceFile(file: File) {
  if (file.size <= 0) {
    return "Choose an evidence photo.";
  }

  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    return "Evidence photos must be 5 MB or smaller.";
  }

  if (!isAllowedEvidenceContentType(file.type)) {
    return "Evidence must be a JPEG, PNG, WebP, or GIF image.";
  }

  return null;
}

export function buildEvidenceStoragePath({
  evidenceId,
  familyId,
  memberId,
  taskId,
  type,
}: {
  evidenceId: string;
  familyId: string;
  memberId: string;
  taskId: string;
  type: AllowedEvidenceContentType;
}) {
  return `${familyId}/${taskId}/${memberId}/${evidenceId}.${extensionByContentType[type]}`;
}
