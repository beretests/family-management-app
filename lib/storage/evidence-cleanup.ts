import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EVIDENCE_RETENTION_DAYS,
  TASK_EVIDENCE_BUCKET,
} from "@/lib/storage/evidence";

export type EvidenceCleanupCandidate = {
  id: string;
  storageBucket: string;
  storagePath: string;
  createdAt: string;
  retentionDeleteAfter: string | null;
  taskStatus: string | null;
  taskApprovedAt: string | null;
  taskRejectedAt: string | null;
};

export type EvidenceCleanupResult = {
  deletedMetadataRows: number;
  deletedStorageObjects: number;
  failedStorageObjects: number;
  scannedRows: number;
};

type EvidenceCleanupRow = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  created_at: string;
  retention_delete_after: string | null;
  task:
    | {
        approved_at: string | null;
        rejected_at: string | null;
        status: string;
      }
    | {
        approved_at: string | null;
        rejected_at: string | null;
        status: string;
      }[]
    | null;
};

const reviewedStatuses = new Set(["approved", "rejected"]);

function taskFromRow(row: EvidenceCleanupRow) {
  if (Array.isArray(row.task)) {
    return row.task[0] ?? null;
  }

  return row.task;
}

function mapCleanupRow(row: EvidenceCleanupRow): EvidenceCleanupCandidate {
  const task = taskFromRow(row);

  return {
    createdAt: row.created_at,
    id: row.id,
    retentionDeleteAfter: row.retention_delete_after,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    taskApprovedAt: task?.approved_at ?? null,
    taskRejectedAt: task?.rejected_at ?? null,
    taskStatus: task?.status ?? null,
  };
}

function cutoffDate(now: Date, retentionDays: number) {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

export function selectCleanupCandidates({
  candidates,
  now,
  retentionDays = EVIDENCE_RETENTION_DAYS,
}: {
  candidates: EvidenceCleanupCandidate[];
  now: Date;
  retentionDays?: number;
}) {
  const fallbackCutoff = cutoffDate(now, retentionDays).getTime();

  return candidates.filter((candidate) => {
    if (candidate.storageBucket !== TASK_EVIDENCE_BUCKET) {
      return false;
    }

    if (candidate.retentionDeleteAfter) {
      return (
        new Date(candidate.retentionDeleteAfter).getTime() <= now.getTime()
      );
    }

    if (!candidate.taskStatus || !reviewedStatuses.has(candidate.taskStatus)) {
      return false;
    }

    const reviewedAt =
      candidate.taskApprovedAt ??
      candidate.taskRejectedAt ??
      candidate.createdAt;

    return new Date(reviewedAt).getTime() <= fallbackCutoff;
  });
}

export async function cleanupExpiredEvidence({
  batchSize = 100,
  now = new Date(),
  retentionDays = EVIDENCE_RETENTION_DAYS,
  supabase,
}: {
  batchSize?: number;
  now?: Date;
  retentionDays?: number;
  supabase: SupabaseClient;
}): Promise<EvidenceCleanupResult> {
  const staleCreatedAt = cutoffDate(now, retentionDays).toISOString();
  const { data, error } = await supabase
    .from("task_evidence_files")
    .select(
      "id,storage_bucket,storage_path,created_at,retention_delete_after,task:task_instances!task_evidence_files_task_instance_id_fkey(status,approved_at,rejected_at)",
    )
    .or(
      `retention_delete_after.lte.${now.toISOString()},created_at.lte.${staleCreatedAt}`,
    )
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(error.message);
  }

  const scanned = ((data ?? []) as unknown as EvidenceCleanupRow[]).map(
    mapCleanupRow,
  );
  const expired = selectCleanupCandidates({
    candidates: scanned,
    now,
    retentionDays,
  });
  const deletedIds: string[] = [];
  let deletedStorageObjects = 0;
  let failedStorageObjects = 0;

  for (const candidate of expired) {
    const { error: storageError } = await supabase.storage
      .from(candidate.storageBucket)
      .remove([candidate.storagePath]);

    if (storageError) {
      failedStorageObjects += 1;
      continue;
    }

    deletedStorageObjects += 1;
    deletedIds.push(candidate.id);
  }

  if (deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("task_evidence_files")
      .delete()
      .in("id", deletedIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  return {
    deletedMetadataRows: deletedIds.length,
    deletedStorageObjects,
    failedStorageObjects,
    scannedRows: scanned.length,
  };
}
