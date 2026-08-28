import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

type SupabaseLocalEnv = {
  apiUrl: string;
  adminKey: string;
};

export async function createConfirmedParentUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { adminKey, apiUrl } = getSupabaseLocalEnv();
  const supabase = createClient(apiUrl, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });

  if (error) {
    throw new Error(`Could not create local E2E auth user: ${error.message}`);
  }
}

type MailpitMessage = {
  ID: string;
  To?: Array<{ Address?: string }>;
};

export async function getLocalAuthEmailLink({
  email,
  pathIncludes,
}: {
  email: string;
  pathIncludes: string;
}) {
  const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:55424";
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const response = await fetch(`${mailpitUrl}/api/v1/messages`);

    if (response.ok) {
      const payload = (await response.json()) as {
        messages?: MailpitMessage[];
      };
      const message = payload.messages?.find((candidate) =>
        candidate.To?.some(
          (recipient) =>
            recipient.Address?.toLowerCase() === email.toLowerCase(),
        ),
      );

      if (message) {
        const detailResponse = await fetch(
          `${mailpitUrl}/api/v1/message/${message.ID}`,
        );
        const detail = (await detailResponse.json()) as {
          HTML?: string;
          Text?: string;
        };
        const content = `${detail.HTML ?? ""}\n${detail.Text ?? ""}`.replaceAll(
          "&amp;",
          "&",
        );
        const links = content.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
        const link = links.find((candidate) => {
          let decodedCandidate = candidate;

          for (let count = 0; count < 2; count += 1) {
            decodedCandidate = decodeURIComponent(decodedCandidate);
          }

          return (
            candidate.includes("/auth/v1/verify") &&
            decodedCandidate.includes(pathIncludes)
          );
        });

        if (link) {
          return link.replace(/[).]+$/, "");
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Could not find a local auth email for ${email}.`);
}

export function getSupabaseLocalEnv(): SupabaseLocalEnv {
  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SECRET_KEY;

  if (apiUrl && adminKey) {
    return { adminKey, apiUrl };
  }

  return parseSupabaseStatusEnv();
}

function parseSupabaseStatusEnv(): SupabaseLocalEnv {
  let output = "";

  try {
    output = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error(
      "E2E tests need local Supabase running, or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY set.",
    );
  }

  const values = new Map<string, string>();

  for (const line of output.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)="(.+)"$/);

    if (match) {
      values.set(match[1], match[2]);
    }
  }

  const apiUrl = values.get("API_URL");
  const adminKey = values.get("SERVICE_ROLE_KEY");

  if (!apiUrl || !adminKey) {
    throw new Error("Could not read local Supabase API URL and admin key.");
  }

  return { adminKey, apiUrl };
}
