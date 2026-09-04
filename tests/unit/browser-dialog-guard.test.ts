import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoots = ["app", "components", "features", "lib"];
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const forbiddenPatterns = [
  {
    label: "browser alert, confirm, or prompt call",
    pattern:
      /\b(?:window|globalThis|self)\s*(?:\.\s*(?:alert|confirm|prompt)|\[\s*["'](?:alert|confirm|prompt)["']\s*\])\s*\(/,
  },
  {
    label: "bare browser alert, confirm, or prompt call",
    pattern: /(^|[^\w.])(?:alert|confirm|prompt)\s*\(/m,
  },
  {
    label: "beforeunload handler",
    pattern: /\b(?:beforeunload|onbeforeunload)\b/,
  },
];

describe("browser automation safety", () => {
  it("does not use browser-level blocking dialogs", () => {
    const violations = sourceRoots.flatMap((root) =>
      sourceFiles(join(process.cwd(), root)).flatMap((file) => {
        const contents = readFileSync(file, "utf8");

        return forbiddenPatterns
          .filter(({ pattern }) => pattern.test(contents))
          .map(
            ({ label }) => `${relative(process.cwd(), file)} uses a ${label}`,
          );
      }),
    );

    expect(violations).toEqual([]);
  });
});

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return entry.isFile() && sourceExtensions.has(extname(entry.name))
      ? [path]
      : [];
  });
}
