import React from 'react';
import Link from 'next/link';
import {
  Camera,
  ShieldCheck,
  Leaf,
  ClipboardList,
  CalendarDays,
  TrendingUp,
  Cpu,
  Sparkles,
  ArrowRight,
  Info,
  PlayCircle,
} from 'lucide-react';
import { APP_NAME } from '../lib/constants';

// Matches the login page: the demo entry point only exists on showcase deployments.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';
const btnBase = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${focusRing}`;
const btnPrimary = `${btnBase} bg-emerald-500 hover:bg-emerald-400 text-slate-950`;
const btnSecondary = `${btnBase} border border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 text-slate-100`;

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#safety', label: 'Safety tiers' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#diets', label: 'Diet protocols' },
];

const STATS = [
  { value: '20', label: 'diet protocols' },
  { value: '5', label: 'safety tiers' },
  { value: '105+', label: 'vegetables profiled' },
  { value: '8', label: 'step assessment' },
];

const FEATURES = [
  {
    icon: Camera,
    title: 'Photo food scanner',
    body: 'Snap or upload a meal. Detection runs in your browser, and similar-food suggestions let you correct a wrong guess in one tap with macros recalculated instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Clinical safety tiers',
    body: 'Every detected food is checked against your conditions and allergies and labelled from Safe to Professional review, with the reason shown.',
  },
  {
    icon: Leaf,
    title: '20 diet protocols',
    body: 'Evidence-graded protocols for conditions like PCOS, thyroid, insulin resistance and gout, with a contraindication check before you adopt one.',
  },
  {
    icon: ClipboardList,
    title: 'Meal logging',
    body: 'Log what you scan, review the macro breakdown per meal, and delete entries you no longer want. Totals are always recalculated on the server from the items.',
  },
  {
    icon: CalendarDays,
    title: 'Weekly planner',
    body: 'Lay out a seven-day plan so tomorrow’s meals are decided before you are hungry.',
  },
  {
    icon: TrendingUp,
    title: 'Progress tracking',
    body: 'Weight logs, trend charts and nutrition history, plus a vegetable explorer with 100 g reference values.',
  },
];

const TIERS = [
  {
    name: 'Safe',
    tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    body: 'Fits your protocol and conditions.',
  },
  {
    name: 'Caution',
    tone: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    body: 'Mind the portion or the preparation, e.g. moderate white rice with insulin resistance.',
  },
  {
    name: 'Limit',
    tone: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    body: 'Large portions discouraged, e.g. a big serving of red meat with gout.',
  },
  {
    name: 'Avoid',
    tone: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    body: 'Conflicts with an allergy or a medical restriction you entered.',
  },
  {
    name: 'Professional review',
    tone: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    body: 'No automated advice. Needs a clinician, e.g. high protein with kidney disease.',
  },
];

const STEPS = [
  {
    title: 'Tell us about you',
    body: 'An 8-step assessment captures your goal, body metrics, conditions and allergies, then sets your daily targets.',
  },
  {
    title: 'Scan a meal',
    body: 'Take a photo. NutriLens lists each food, its estimated portion and macros, and a safety tier for each.',
  },
  {
    title: 'Log and follow up',
    body: 'Save the meal, then track your day, your week and your weight from the dashboard.',
  },
];

const DIET_HIGHLIGHTS = [
  'PCOS & Hormone Balance',
  'Hypothyroidism Nutrition',
  'Low-GI Insulin Resistance',
  'DASH Cardio Care',
  'Fatty Liver (NAFLD)',
  'Low-Purine Gout Care',
  'Fertility Prep',
  'Targeted Deshi Keto',
  'Intermittent Fasting 14/10',
  'Muscle Recomposition',
  'Mediterranean Longevity',
  'Perimenopause & Bone Density',
];

const SAMPLE_ITEMS = [
  { name: 'Grilled chicken', grams: 150, tier: 'Safe', tone: 'text-emerald-300' },
  { name: 'White rice', grams: 120, tier: 'Caution', tone: 'text-amber-300' },
  { name: 'Cucumber salad', grams: 100, tier: 'Safe', tone: 'text-emerald-300' },
];

const SAMPLE_MACROS = [
  { label: 'Protein', grams: 54, pct: 34, bar: 'bg-purple-500', text: 'text-purple-300' },
  { label: 'Carbs', grams: 68, pct: 43, bar: 'bg-amber-500', text: 'text-amber-300' },
  { label: 'Fat', grams: 16, pct: 23, bar: 'bg-rose-500', text: 'text-rose-300' },
];

function SectionHeading({ id, eyebrow, title, intro }: { id: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">{eyebrow}</p>
      <h2 id={id} className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
        {title}
      </h2>
      {intro && <p className="mt-4 text-slate-400 leading-relaxed">{intro}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-slate-950 ${focusRing}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/" className={`flex items-center gap-2.5 rounded-lg ${focusRing}`}>
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">{APP_NAME}</span>
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={`rounded hover:text-emerald-400 transition-colors ${focusRing}`}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className={`${btnSecondary} px-3.5 py-2 text-sm`}>
              Sign in
            </Link>
            <Link href="/register" className={`${btnPrimary} hidden sm:inline-flex px-3.5 py-2 text-sm`}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section aria-labelledby="hero-title" className="relative px-6 pt-16 pb-20 sm:pt-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-emerald-500/10 to-transparent"
          />
          <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 mb-6">
                <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                Scanning runs on your device
              </p>
              <h1 id="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Scan your meal.{' '}
                <span className="text-emerald-400">Know if it fits your health.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {APP_NAME} turns a photo of your plate into calories and macros, then checks each food against your
                conditions and diet protocol, so you see not just what you ate but whether it is right for you.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/register" className={`${btnPrimary} px-7 py-3.5 text-base`}>
                  Create free account
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                {DEMO_MODE ? (
                  <Link href="/login" className={`${btnSecondary} px-7 py-3.5 text-base`}>
                    <PlayCircle className="w-4 h-4" aria-hidden="true" />
                    Live Demo
                  </Link>
                ) : (
                  <a href="#how-it-works" className={`${btnSecondary} px-7 py-3.5 text-base`}>
                    See how it works
                  </a>
                )}
              </div>
            </div>

            {/* Illustrative result, built from markup so nothing here is a hotlinked image or a fake metric */}
            <figure aria-label="Example scan result" className="relative">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
                <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-800">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chicken &amp; rice plate</p>
                    <p className="mt-1 text-4xl font-extrabold text-white">
                      632 <span className="text-sm font-semibold text-emerald-400">kcal</span>
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                    1 item to watch
                  </span>
                </div>

                <ul className="py-4 divide-y divide-slate-800/80 text-sm">
                  {SAMPLE_ITEMS.map((item) => (
                    <li key={item.name} className="flex items-center justify-between py-2.5">
                      <span className="text-slate-200">
                        {item.name} <span className="text-slate-500">· {item.grams} g</span>
                      </span>
                      <span className={`text-xs font-semibold ${item.tone}`}>{item.tier}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  {SAMPLE_MACROS.map((macro) => (
                    <div key={macro.label}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className={macro.text}>{macro.label}</span>
                        <span className="text-slate-300">
                          {macro.grams} g · {macro.pct}% of energy
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${macro.bar}`} style={{ width: `${macro.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-5 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  Rice is fine in a moderate portion on a low-GI protocol. Keep it near 120 g.
                </p>
              </div>
              <figcaption className="mt-3 text-center text-xs text-slate-500">
                Illustrative example. Your results depend on your photo, portions and profile.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Facts */}
        <section aria-label="NutriLens at a glance" className="px-6">
          <ul className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800">
            {STATS.map((stat) => (
              <li key={stat.label} className="bg-slate-950 px-6 py-6 text-center">
                <span className="block text-3xl font-extrabold text-white">{stat.value}</span>
                <span className="mt-1 block text-sm text-slate-400">{stat.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-20 px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              id="features-title"
              eyebrow="What you get"
              title="Everything between the plate and the progress chart"
              intro="One account covers scanning, logging, planning and tracking, all scoped to your own profile."
            />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Safety tiers */}
        <section id="safety" aria-labelledby="safety-title" className="scroll-mt-20 border-y border-slate-800/70 bg-slate-900/30 px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              id="safety-title"
              eyebrow="Built-in guardrails"
              title="Five tiers, so you always know why"
              intro="The scanner never just prints numbers. Each food gets a tier based on the conditions, allergies and protocol in your profile."
            />
            <ol className="grid gap-4 md:grid-cols-5">
              {TIERS.map((tier) => (
                <li key={tier.name} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold ${tier.tone}`}>
                    {tier.name}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{tier.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <SectionHeading id="how-title" eyebrow="Three steps" title="From sign-up to your first logged meal" />
            <ol className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-lg font-bold text-emerald-300">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Diets */}
        <section id="diets" aria-labelledby="diets-title" className="scroll-mt-20 border-t border-slate-800/70 px-6 py-24">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              id="diets-title"
              eyebrow="Diet protocols"
              title="Twenty protocols, each with an evidence level"
              intro="Each one lists its mechanism, macro ranges scaled to your energy needs, and who should not follow it."
            />
            <ul className="flex flex-wrap justify-center gap-2.5">
              {DIET_HIGHLIGHTS.map((name) => (
                <li key={name} className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-slate-200">
                  {name}
                </li>
              ))}
              <li className="rounded-full border border-dashed border-slate-700 px-4 py-2 text-sm text-slate-400">+ 8 more</li>
            </ul>
          </div>
        </section>

        {/* Disclaimer + CTA */}
        <section aria-labelledby="cta-title" className="px-6 pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="cta-title" className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Start with your first scan
            </h2>
            <p className="mt-4 text-slate-400">
              Create an account, complete the assessment and your dashboard is ready in a few minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className={`${btnPrimary} px-8 py-3.5 text-base`}>
                Create free account
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-10 mx-auto max-w-2xl text-xs leading-relaxed text-slate-500">
              {APP_NAME} gives educational estimates from a photo and your profile. It is not a medical device and does
              not replace advice from your doctor or dietitian. Portion and calorie values can be off, so check and
              correct the detected foods.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/70 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} {APP_NAME}
          </p>
          <nav aria-label="Footer" className="flex gap-6">
            <Link href="/login" className={`rounded hover:text-slate-300 ${focusRing}`}>
              Sign in
            </Link>
            <Link href="/register" className={`rounded hover:text-slate-300 ${focusRing}`}>
              Create account
            </Link>
            <Link href="/forgot-password" className={`rounded hover:text-slate-300 ${focusRing}`}>
              Reset password
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
