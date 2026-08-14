const fullAppRoutePrefixes = [
  "/dashboard",
  "/my-today",
  "/chores",
  "/assignments",
  "/approvals",
  "/rewards",
  "/leaderboard",
  "/reminders",
  "/kid-mode",
] as const;

export function routeRequiresFullApp(pathname: string) {
  return fullAppRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
