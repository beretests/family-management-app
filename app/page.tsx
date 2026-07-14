import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gift,
  HeartHandshake,
  LogIn,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  UsersRound,
} from "lucide-react";

const steps = [
  {
    title: "Create a parent account",
    description:
      "Start with a private parent login, then set up your family workspace.",
    icon: UserPlus,
  },
  {
    title: "Add kids and routines",
    description:
      "Capture ages, ability levels, schedules, preferences, and rest days.",
    icon: UsersRound,
  },
  {
    title: "Plan fair chores",
    description:
      "Balance chores around school, activities, disliked tasks, and workload.",
    icon: ClipboardList,
  },
  {
    title: "Review and celebrate",
    description:
      "Kids submit work, parents approve it, and rewards stay family-private.",
    icon: Trophy,
  },
] satisfies FeatureItem[];

const parentFeatures = [
  {
    title: "One family schedule",
    description:
      "See appointments, activities, rest days, and chore timing together.",
    icon: CalendarDays,
  },
  {
    title: "Fair assignment reasons",
    description:
      "Understand why chores were suggested before assigning them.",
    icon: ShieldCheck,
  },
  {
    title: "Parent review controls",
    description:
      "Approve, reject with kind feedback, and manage points with care.",
    icon: BadgeCheck,
  },
] satisfies FeatureItem[];

const kidFeatures = [
  {
    title: "Simple today list",
    description:
      "Kids can focus on what is due now without digging through parent tools.",
    icon: CheckCircle2,
  },
  {
    title: "Points and rewards",
    description:
      "Progress feels visible with private rewards that parents control.",
    icon: Gift,
  },
  {
    title: "Friendly encouragement",
    description:
      "The app supports teamwork without public shaming or pressure.",
    icon: HeartHandshake,
  },
] satisfies FeatureItem[];

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)]">
      <section className="hero-scene border-b border-[var(--line)]">
        <div className="mx-auto grid min-h-[680px] w-full max-w-6xl content-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="max-w-2xl self-center">
            <BrandMark />
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-normal text-[var(--foreground)] sm:text-5xl">
              Chores, schedules, and rewards that feel fair for the whole family.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Family Chore Hub helps parents plan around real life while kids
              get a clear, colorful view of what to do next.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--accent-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--focus)]"
                href="/sign-up"
              >
                <UserPlus aria-hidden="true" className="size-5" />
                Create account
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--line-strong)] bg-white px-5 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--focus)]"
                href="/sign-in"
              >
                <LogIn aria-hidden="true" className="size-5" />
                Sign in
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold text-[var(--muted)]">
              <span className="rounded-md bg-white px-3 py-2 shadow-sm">
                Private family workspace
              </span>
              <span className="rounded-md bg-white px-3 py-2 shadow-sm">
                Kid Mode ready
              </span>
              <span className="rounded-md bg-white px-3 py-2 shadow-sm">
                Free-tier friendly
              </span>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase text-[var(--accent-strong)]">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            A calmer flow from family setup to chore approval.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <FeatureCard
              description={step.description}
              icon={step.icon}
              key={step.title}
              label={`Step ${index + 1}`}
              title={step.title}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <FeatureGroup
            eyebrow="For parents"
            features={parentFeatures}
            title="Plan with context, not guesswork."
          />
          <FeatureGroup
            eyebrow="For kids"
            features={kidFeatures}
            title="Make today's work easy to understand."
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--accent-strong)]">
            Ready when your family is
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            Create the parent account first, then invite the family into the routine.
          </h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--accent-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--focus)]"
            href="/sign-up"
          >
            <UserPlus aria-hidden="true" className="size-5" />
            Create account
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--line-strong)] bg-white px-5 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--focus)]"
            href="/sign-in"
          >
            <LogIn aria-hidden="true" className="size-5" />
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-white px-3 py-2 shadow-sm">
      <span className="grid size-10 place-items-center rounded-full bg-[var(--accent)] text-white">
        <Sparkles aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="text-sm font-extrabold uppercase text-[var(--accent-strong)]">
          Family Chore Hub
        </p>
        <p className="text-xs font-semibold text-[var(--muted)]">
          Fair plans for busy families
        </p>
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="self-center rounded-lg border border-[var(--line)] bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-sm font-bold text-[var(--accent-strong)]">
            Today
          </p>
          <h2 className="text-2xl font-extrabold text-[var(--foreground)]">
            Family plan
          </h2>
        </div>
        <span className="rounded-full bg-[var(--playful-yellow-soft)] px-3 py-1 text-sm font-bold text-[var(--playful-yellow)]">
          3 wins
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <PreviewRow
          icon={CalendarDays}
          meta="After school"
          title="Check the schedule before chores"
          tone="sky"
        />
        <PreviewRow
          icon={ClipboardList}
          meta="Fair rotation"
          title="Assign work by age, ability, and time"
          tone="mint"
        />
        <PreviewRow
          icon={Gift}
          meta="Private rewards"
          title="Approve points and celebrate progress"
          tone="berry"
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <PreviewMetric icon={Star} label="Focus" value="Clear" />
        <PreviewMetric icon={ShieldCheck} label="Privacy" value="Family" />
        <PreviewMetric icon={HeartHandshake} label="Tone" value="Kind" />
      </div>
    </div>
  );
}

function PreviewRow({
  icon: Icon,
  meta,
  title,
  tone,
}: {
  icon: LucideIcon;
  meta: string;
  title: string;
  tone: "berry" | "mint" | "sky";
}) {
  const toneClasses = {
    berry: "bg-[var(--playful-berry-soft)] text-[var(--playful-berry)]",
    mint: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
    sky: "bg-[var(--info-soft)] text-[var(--info)]",
  };

  return (
    <article className="grid grid-cols-[44px_1fr] gap-3 rounded-md border border-[var(--line)] p-3">
      <div
        className={`grid size-11 place-items-center rounded-md ${toneClasses[tone]}`}
      >
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div>
        <h3 className="font-bold text-[var(--foreground)]">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{meta}</p>
      </div>
    </article>
  );
}

function PreviewMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md bg-[var(--background)] p-3">
      <Icon aria-hidden="true" className="size-4 text-[var(--accent)]" />
      <p className="mt-2 text-sm font-extrabold text-[var(--foreground)]">
        {value}
      </p>
      <p className="text-xs font-semibold uppercase text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}

function FeatureGroup({
  eyebrow,
  features,
  title,
}: {
  eyebrow: string;
  features: FeatureItem[];
  title: string;
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--background)] p-5">
      <div>
        <p className="text-sm font-bold uppercase text-[var(--accent-strong)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
          {title}
        </h2>
      </div>
      <div className="grid gap-3">
        {features.map((feature) => (
          <FeatureCard
            description={feature.description}
            icon={feature.icon}
            key={feature.title}
            title={feature.title}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureCard({
  description,
  icon: Icon,
  label,
  title,
}: {
  description: string;
  icon: LucideIcon;
  label?: string;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        {label ? (
          <span className="rounded-full bg-[var(--playful-sky-soft)] px-3 py-1 text-xs font-extrabold uppercase text-[var(--info)]">
            {label}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-lg font-bold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
    </article>
  );
}
