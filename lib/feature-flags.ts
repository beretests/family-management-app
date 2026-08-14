export function parseFeatureFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function isFullAppEnabled() {
  return parseFeatureFlag(process.env.ENABLE_FULL_APP);
}
