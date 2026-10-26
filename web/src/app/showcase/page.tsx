import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Camera,
  Brain,
  ShieldCheck,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  CalendarDays,
  LineChart,
  Carrot,
  Smartphone,
  Server,
  Users,
  ScanLine,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  Rocket,
  KeyRound,
} from 'lucide-react';
import { APP_NAME, DEMO_LOGINS } from '../../lib/constants';

export const metadata: Metadata = {
  title: 'NutriLens — AI Nutrition & Clinical Diet Platform · Live Demo',
  description:
    'Full-source AI nutrition platform: photo-based food scanning, 5-tier clinical safety checks, 20 evidence-graded diet protocols, personalized 7-day plans and an admin panel. Built with Next.js, Express and MongoDB.',
};

const DEMO_HREF = '/login';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#scanner', label: 'AI Scanner' },
  { href: '#safety', label: 'Clinical Safety' },
  { href: '#roles', label: 'Roles' },
  { href: '#screens', label: 'Screens' },
  { href: '#tech', label: 'Technology' },
];

const STATS = [
  { value: '20', label: 'Evidence-graded diet protocols' },
  { value: '5-tier', label: 'Clinical food safety checks' },
  { value: '105+', label: 'Verified vegetables (USDA / ICMR)' },
  { value: '8-step', label: 'Health assessment & 7-day plan' },
  { value: '2', label: 'Roles: Member app + Admin panel' },
  { value: '$0', label: 'Paid vision API needed (on-device AI)' },
];

const FEATURES = [
  { icon: Camera, title: 'AI food scanner', text: 'Snap or upload a meal. On-device TensorFlow.js MobileNetV2 plus colour and texture analysis name the foods, estimate portions and calculate macros.' },
  { icon: Brain, title: 'Visual memory', text: 'When a member corrects a result, a 64-bit perceptual hash (dHash) remembers it, so the same food is recognised correctly next time.' },
  { icon: ShieldCheck, title: '5-tier clinical checks', text: 'Every scanned or logged food is rated SAFE, CAUTION, LIMIT, AVOID or PROFESSIONAL REVIEW against the member’s conditions and allergies.' },
  { icon: BookOpen, title: '20 diet protocols', text: 'PCOS, thyroid, insulin resistance, DASH, gout, fatty liver, fertility and more — each with macro ranges, evidence grade and contraindications.' },
  { icon: ClipboardList, title: 'Assessment → personal plan', text: 'An 8-step onboarding computes BMI, BMR and TDEE (Mifflin-St Jeor), ranks protocols and generates a 7-day meal plan with local foods.' },
  { icon: LayoutDashboard, title: 'Nutrition dashboard', text: 'Calorie ring, macro targets, hydration and activity guidance, plus a 30-day energy-balance projection — all calculated from real logs.' },
  { icon: CalendarDays, title: 'Meal planner & history', text: 'Weekly planner, one-tap logging from scans, and a full meal history with per-item macro breakdowns.' },
  { icon: LineChart, title: 'Progress analytics', text: 'Weight trend, calorie and macro history charts over 7, 14 or 30 days, stored per member in MongoDB.' },
  { icon: Carrot, title: 'Vegetable explorer', text: 'Searchable catalogue of 105+ South Asian and international vegetables, standardised per 100 g raw edible portion.' },
];

const SCAN_STEPS = [
  { title: 'Snap or upload', text: 'Camera capture or image upload, with one-click sample meals for demos.' },
  { title: 'On-device vision', text: 'MobileNetV2 + chromatic histogram run in the browser; optional Gemini vision on the server.' },
  { title: 'Candidates & portions', text: 'Similar-food chips allow a one-tap swap; portions update the macros live.' },
  { title: 'Clinical check & log', text: 'Each item gets a safety tier for the member’s protocol, then logs to today’s meals.' },
];

const SAFETY_TIERS = [
  { tier: 'SAFE', tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', text: 'Fits the member’s protocol and conditions.' },
  { tier: 'CAUTION', tone: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300', text: 'Mind the portion or preparation — e.g. moderate white rice with diabetes.' },
  { tier: 'LIMIT', tone: 'border-orange-500/40 bg-orange-500/10 text-orange-300', text: 'Large portions discouraged — e.g. 200 g+ white rice for diabetes.' },
  { tier: 'AVOID', tone: 'border-rose-500/40 bg-rose-500/10 text-rose-300', text: 'Allergen or strict medical conflict for this member.' },
  { tier: 'PROFESSIONAL REVIEW', tone: 'border-purple-500/40 bg-purple-500/10 text-purple-300', text: 'Automatic advice is blocked — e.g. kidney disease with a high-protein plan.' },
];

const PROTOCOLS = [
  'PCOS & Hormone Balance', 'Hypothyroidism', 'Low-GI Insulin Resistance', 'DASH Cardio Care', 'Fatty Liver (NAFLD)',
  'Low-Purine Gout Care', 'Fertility Prep', 'Targeted Deshi Keto', 'Hormone-Safe Fasting 14/10', 'Gut Healing & Anti-Bloat',
  'Muscle Recomposition', 'Estrogen Balance', 'Iron & Hemoglobin Booster', 'Postpartum & Lactation', 'Collagen & Skin-Hair',
  'Mediterranean Longevity', 'Stress & Adrenal Support', 'Healthy Weight Gain', 'PMS & PMDD Care', 'Perimenopause & Bone',
];

const ROLE_DETAILS = {
  user: {
    icon: Smartphone,
    tone: 'from-emerald-500/20 to-teal-500/5 border-emerald-500/30',
    iconTone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    points: [
      'Dashboard with calories, macros, hydration and 30-day projection',
      'AI food scanner with similar-food swap and clinical safety tier',
      'Personalized 7-day plan from the 8-step health assessment',
      'Meal planner, meal history, progress charts and vegetable explorer',
    ],
  },
  admin: {
    icon: ShieldCheck,
    tone: 'from-purple-500/20 to-indigo-500/5 border-purple-500/30',
    iconTone: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    points: [
      'Platform KPIs and 14-day meal & scan activity',
      'Member directory with assessment status, plan and activity',
      'AI scan feed with per-item confidence and visual-memory corrections',
      'Diet protocol catalogue and food / vegetable database with publish controls',
    ],
  },
} as const;

const SCREENS = [
  { src: '/showcase/dashboard.png', title: 'Member dashboard', text: 'Daily budget, macros, hydration and the saved 7-day plan.' },
  { src: '/showcase/scan-result.png', title: 'AI scan result', text: 'Detected foods, portions, macros and the clinical safety tier.' },
  { src: '/showcase/progress.png', title: 'Progress & trends', text: 'Weight trend and nutrition history from real logs.' },
  { src: '/showcase/planner.png', title: 'Weekly meal planner', text: 'Plan slots generated from the member’s protocol.' },
  { src: '/showcase/admin-overview.png', title: 'Admin overview', text: 'KPIs, daily activity, goals, conditions and plan adoption.' },
  { src: '/showcase/admin-members.png', title: 'Admin members', text: 'Searchable directory with plans, meals and scan counts.' },
];

const TECH = [
  { icon: Code2, group: 'Frontend', items: ['Next.js 15 (App Router)', 'React 19 + TypeScript', 'Tailwind CSS v4', 'Zustand state', 'Recharts', 'React Hook Form + Zod'] },
  { icon: Server, group: 'Backend', items: ['Node.js + Express 4', 'MongoDB + Mongoose 8', 'Signed JWT sessions', 'scrypt password hashing', 'Role-based admin API', 'Per-member data scoping'] },
  { icon: Brain, group: 'AI & nutrition', items: ['TensorFlow.js MobileNetV2', 'Canvas colour & texture analysis', '64-bit dHash visual memory', 'Optional Google Gemini vision', 'Mifflin-St Jeor energy engine', 'ADA / AHA / KDIGO-aligned rules'] },
  { icon: Rocket, group: 'Deployment', items: ['Vercel config for the web app', 'Render blueprint for the API', 'MongoDB Atlas ready', 'Seeder with demo data', 'Env examples included', 'Health-check endpoint'] },
];

const INCLUDED = [
  { icon: Code2, title: '100% source code', text: 'Next.js web app and Express API in one repository.' },
  { icon: Database, title: 'Seed & demo data', text: 'Foods, vegetables, diet protocols, demo member, admin and sample members.' },
  { icon: FileText, title: 'Documentation', text: 'README, business requirements, software requirements and deployment guide.' },
  { icon: Rocket, title: 'Deploy configs', text: 'vercel.json, render.yaml and environment examples for both apps.' },
];

function DemoLink({ className = '', children = 'Live Demo' }: { className?: string; children?: React.ReactNode }) {
  return (
    <Link
      href={DEMO_HREF}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3.5 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/30 border border-emerald-300/40 transition-all hover:from-emerald-400 hover:to-teal-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 ${className}`}
    >
      {children}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12">
      <span className="text-xs uppercase font-bold tracking-[0.18em] text-emerald-400">{eyebrow}</span>
      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">{title}</h2>
      {text && <p className="text-slate-400 mt-4 leading-relaxed">{text}</p>}
    </div>
  );
}

function BrowserFrame({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800 bg-slate-900/90">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
      </div>
      <Image src={src} alt={alt} width={1440} height={900} priority={priority} className="w-full h-auto" />
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/75 border-b border-slate-800/70 px-4 sm:px-6 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/showcase" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">{APP_NAME}</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300" aria-label="Sections">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-emerald-400 transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
          <Link
            href={DEMO_HREF}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 transition-colors"
          >
            Live Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-4 sm:px-6 lg:px-12 pt-14 sm:pt-20 pb-16">
          <div className="absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-0" />
          <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Code2 className="w-3.5 h-3.5" /> Full source · Member app + Admin panel
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.05]">
                AI Nutrition &amp;{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Clinical Diet Platform
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed">
                {APP_NAME} turns a meal photo into calories and macros in seconds, checks every food against the member’s health
                conditions, and builds a personalized 7-day plan from 20 evidence-graded diet protocols — with an admin panel to run
                the whole platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <DemoLink className="w-full sm:w-auto" />
                <a
                  href="#features"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-base font-semibold text-slate-100 hover:border-slate-500 transition-colors"
                >
                  Explore features
                </a>
              </div>
              <p className="mt-4 text-xs text-slate-400 flex items-center justify-center lg:justify-start gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> One-click demo logins for Member and Admin on the sign-in page
              </p>
            </div>

            <div className="lg:col-span-7 relative">
              <BrowserFrame src="/showcase/dashboard.png" alt={`${APP_NAME} member dashboard`} priority />
              <div className="hidden sm:block absolute -bottom-10 -left-6 w-[30%] max-w-[210px] rounded-[2rem] border-[6px] border-slate-800 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">
                <Image src="/showcase/mobile-scan.png" alt={`${APP_NAME} AI scanner on mobile`} width={390} height={844} className="w-full h-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 sm:px-6 lg:px-12 py-10 border-y border-slate-800/70 bg-slate-900/30">
          <dl className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl font-black text-white tracking-tight">{stat.value}</dd>
                <dd className="text-xs text-slate-400 mt-1 leading-snug">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* What it is */}
        <section className="px-4 sm:px-6 lg:px-12 py-20 max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="What you get"
            title="One platform, three working parts"
            text="Members, administrators and the API share one MongoDB dataset, so everything a member logs shows up in the admin panel instantly."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, title: 'Member web app', text: 'Responsive Next.js app with a desktop sidebar and mobile bottom navigation: scanner, dashboard, plans, planner and progress.' },
              { icon: ShieldCheck, title: 'Admin panel', text: 'Role-protected control centre for members, AI scan activity, diet protocols and the nutrition catalogue.' },
              { icon: Server, title: 'REST API + MongoDB', text: 'Express API with authentication, per-member data scoping, a nutrition intelligence engine and a database seeder.' },
            ].map((card) => (
              <div key={card.title} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center mb-5">
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{card.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 px-4 sm:px-6 lg:px-12 py-20 bg-slate-900/30 border-y border-slate-800/70">
          <div className="max-w-7xl mx-auto">
            <SectionHeading eyebrow="Features" title="Everything a nutrition product needs, already built" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-base font-bold text-white mt-4">{feature.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI scanner */}
        <section id="scanner" className="scroll-mt-24 px-4 sm:px-6 lg:px-12 py-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs uppercase font-bold tracking-[0.18em] text-emerald-400">AI food scanner</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">From photo to macros — and a safety verdict</h2>
              <p className="text-slate-400 mt-4 leading-relaxed">
                The vision pipeline runs in the browser, so scanning works without a paid vision API. Results are matched to a verified
                nutrition database and checked against the member’s protocol before they are logged.
              </p>
              <ol className="mt-8 space-y-4">
                {SCAN_STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="w-9 h-9 shrink-0 rounded-xl bg-slate-800 border border-slate-700 text-emerald-300 font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{step.title}</h3>
                      <p className="text-sm text-slate-400 mt-0.5">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <BrowserFrame src="/showcase/scan-result.png" alt="AI scan result with detected foods, macros and safety tier" />
          </div>
        </section>

        {/* Clinical safety */}
        <section id="safety" className="scroll-mt-24 px-4 sm:px-6 lg:px-12 py-20 bg-slate-900/30 border-y border-slate-800/70">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              eyebrow="Clinical safety"
              title="Five tiers instead of a blunt “avoid”"
              text="Guidance follows ADA, AHA and KDIGO-aligned rules, so healthy staples in sensible portions are not flagged, while risky combinations are routed to a professional."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {SAFETY_TIERS.map((item) => (
                <div key={item.tier} className={`rounded-2xl border p-5 ${item.tone}`}>
                  <div className="text-xs font-black tracking-wider">{item.tier}</div>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
              <h3 className="text-lg font-bold text-white">20 canonical diet protocols</h3>
              <p className="text-sm text-slate-400 mt-1">Each with macro ranges, evidence grade, eligibility and professional-review rules.</p>
              <ul className="mt-6 flex flex-wrap justify-center gap-2 max-w-5xl mx-auto">
                {PROTOCOLS.map((name) => (
                  <li key={name} className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-24 px-4 sm:px-6 lg:px-12 py-20 max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Roles"
            title="Try both sides of the product"
            text="The sign-in page has one-click demo logins. The demo admin is read-only, so every visitor sees the same data."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEMO_LOGINS.map((demo) => {
              const details = ROLE_DETAILS[demo.role];
              return (
                <div key={demo.role} className={`rounded-3xl border bg-gradient-to-b p-7 flex flex-col ${details.tone}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${details.iconTone}`}>
                        <details.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black text-white">{demo.label}</h3>
                    </div>
                    <span className="text-[10px] font-black tracking-widest px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {details.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 rounded-2xl bg-slate-950/70 border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-1">
                    <div><span className="text-slate-500">email&nbsp;&nbsp;&nbsp;</span> {demo.email}</div>
                    <div><span className="text-slate-500">password</span> {demo.password}</div>
                  </div>
                  <DemoLink className="mt-5 w-full text-sm py-3">{demo.role === 'admin' ? 'Open admin demo' : 'Open member demo'}</DemoLink>
                </div>
              );
            })}
          </div>
        </section>

        {/* Screens */}
        <section id="screens" className="scroll-mt-24 px-4 sm:px-6 lg:px-12 py-20 bg-slate-900/30 border-y border-slate-800/70">
          <div className="max-w-7xl mx-auto">
            <SectionHeading eyebrow="Product tour" title="Real screens from the live demo" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SCREENS.map((screen) => (
                <figure key={screen.src}>
                  <BrowserFrame src={screen.src} alt={screen.title} />
                  <figcaption className="mt-3">
                    <span className="text-sm font-bold text-white">{screen.title}</span>
                    <span className="text-sm text-slate-400"> — {screen.text}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Tech */}
        <section id="tech" className="scroll-mt-24 px-4 sm:px-6 lg:px-12 py-20 max-w-7xl mx-auto">
          <SectionHeading eyebrow="Technology" title="A modern, conventional stack" text="No exotic dependencies: easy to host, extend and hand over." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TECH.map((group) => (
              <div key={group.group} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-center gap-2.5">
                  <group.icon className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">{group.group}</h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {group.items.map((techItem) => (
                    <li key={techItem} className="text-sm text-slate-300">{techItem}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Included */}
        <section className="px-4 sm:px-6 lg:px-12 pb-20 max-w-7xl mx-auto">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 sm:p-10">
            <h2 className="text-2xl font-black text-white">What’s included</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {INCLUDED.map((entry) => (
                <div key={entry.title} className="flex gap-3">
                  <entry.icon className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{entry.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 sm:px-6 lg:px-12 pb-24">
          <div className="max-w-4xl mx-auto text-center rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 to-transparent px-6 py-14">
            <div className="flex justify-center gap-3 text-emerald-300">
              <Users className="w-6 h-6" />
              <ScanLine className="w-6 h-6" />
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl font-black text-white tracking-tight">See it running in under a minute</h2>
            <p className="mt-4 text-slate-300 max-w-xl mx-auto">
              Open the live demo, pick Member or Admin, and explore with realistic data — no sign-up needed.
            </p>
            <DemoLink className="mt-8" />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 py-8 px-4 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2 text-slate-300 font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400" /> {APP_NAME}
        </div>
        © 2026 {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
