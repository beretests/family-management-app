import type { LeaderboardEntry } from "@/features/leaderboard/scoring";

export function FamilyLeaderboard({
  entries,
}: {
  entries: LeaderboardEntry[];
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Family progress
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Ranked by a blend of completed chores, effort, saved points, and reward
        use so it is not just a raw points contest.
      </p>
      <div className="mt-4 grid gap-3">
        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            Add child profiles and approve chores to start the family progress
            board.
          </p>
        ) : null}
        {entries.map((entry, index) => (
          <article
            className="rounded-md border border-[var(--line)] p-4"
            key={entry.memberId}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="grid size-11 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: entry.color ?? "#047857" }}
                >
                  {entry.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--accent-strong)]">
                    #{index + 1} · {entry.highlight}
                  </p>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {entry.displayName}
                  </h3>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-semibold text-[var(--foreground)]">
                  {entry.progressScore}
                </p>
                <p className="text-sm text-[var(--muted)]">progress score</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-4">
              <Metric label="Approved chores" value={entry.approvedTasks} />
              <Metric label="Earned" value={entry.taskPointsEarned} />
              <Metric label="Balance" value={entry.pointsBalance} />
              <Metric label="Rewards used" value={entry.rewardPointsSpent} />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--line)] p-3">
      <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}
