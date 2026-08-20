import React from 'react';
import Link from 'next/link';
import {
  Camera,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Flame,
  CheckCircle2,
  ArrowRight,
  Utensils,
  Dumbbell,
  HeartPulse,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { APP_NAME } from '../lib/constants';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/60 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">{APP_NAME}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#diets" className="hover:text-emerald-400 transition-colors">Diet Protocols</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="glow" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Vision AI Nutrition Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Photograph your meal.{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Unlock instant macro truth.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          No tedious manual food weighing. NutriLens combines multimodal vision AI with clinical-grade nutritional databases to calculate calories, macros, and micro-nutrients in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/onboarding" className="w-full sm:w-auto">
            <Button variant="glow" size="lg" className="w-full text-base px-8 py-4">
              Start Free Today
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full text-base px-8 py-4 border-slate-700">
              Explore Live Demo
            </Button>
          </Link>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="relative max-w-4xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-emerald-500/40 via-slate-800 to-slate-900 shadow-2xl shadow-emerald-500/10">
          <div className="bg-slate-950/95 rounded-[22px] p-6 sm:p-8 overflow-hidden text-left">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Image with AI perception overlay */}
              <div className="md:col-span-6 relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80"
                  alt="Scanned Mediterranean Meal"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-between p-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="emerald" className="backdrop-blur-md bg-emerald-950/80">
                      <Camera className="w-3 h-3" /> AI Perception Active
                    </Badge>
                    <span className="text-xs font-mono bg-slate-900/90 px-2 py-1 rounded text-emerald-400 border border-emerald-500/30">
                      98.4% Confidence
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-white">Detected: Mediterranean Chicken Bowl</div>
                    <div className="text-[11px] text-slate-300">4 distinct ingredients identified</div>
                  </div>
                </div>
              </div>

              {/* Nutrition breakdown card */}
              <div className="md:col-span-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400">Total Meal Caloric Value</span>
                    <div className="text-4xl font-black text-white">
                      645 <span className="text-sm font-semibold text-emerald-400">kcal</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-400">Protein Density</span>
                    <div className="text-xl font-bold text-purple-400">54g</div>
                  </div>
                </div>

                {/* Macro pill bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-purple-400">Protein (33%)</span>
                      <span className="text-slate-300">54g / 160g target</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-[34%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-amber-400">Carbohydrates (42%)</span>
                      <span className="text-slate-300">68g / 210g target</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[32%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-rose-400">Healthy Fats (22%)</span>
                      <span className="text-slate-300">16g / 65g target</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full w-[25%]" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Meal successfully satisfies your post-workout leucine threshold.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Built for athletes, biohackers, and busy professionals
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Every feature is engineered to eliminate friction from nutrition tracking while maximizing metabolic clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Multimodal Vision AI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Detects mixed bowls, portion volumes, complex dressings, and side dishes directly from a photo with confidence metrics.
            </p>
          </Card>

          <Card variant="glass" className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Verified Nutrition DB</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ground truth nutritional records with USDA & laboratory-certified macronutrient, fiber, and micronutrient profiles.
            </p>
          </Card>

          <Card variant="glass" className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Dynamic AI Pacing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time advice that adapts to your training load, water intake, and daily targets throughout the day.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works Flow */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto bg-slate-900/30 rounded-3xl border border-slate-800/60 my-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Effortless 3-Step Protocol</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            How NutriLens Powers Your Day
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="space-y-4 text-center p-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-black shadow-lg">
              1
            </div>
            <h4 className="text-lg font-bold text-white">Snap or Upload</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Take a quick photo of your plate before eating. No manual search queries or barcode scanning required.
            </p>
          </div>

          <div className="space-y-4 text-center p-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 text-teal-400 flex items-center justify-center mx-auto text-2xl font-black shadow-lg">
              2
            </div>
            <h4 className="text-lg font-bold text-white">AI Vision Analysis</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our neural network separates each ingredient, estimates mass in grams, and pulls verified macros.
            </p>
          </div>

          <div className="space-y-4 text-center p-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center mx-auto text-2xl font-black shadow-lg">
              3
            </div>
            <h4 className="text-lg font-bold text-white">Log & Optimize</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              One click adds the meal to your daily timeline. Your dashboard recalculates remaining targets in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
          Ready to revolutionize the way you eat?
        </h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Join thousands who transformed their body composition with precision AI nutrition intelligence.
        </p>
        <Link href="/onboarding">
          <Button variant="glow" size="lg" className="px-10 py-4 text-base">
            Create Your Profile Now
          </Button>
        </Link>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 {APP_NAME} AI Systems. Precision Nutrition Intelligence. All rights reserved.</p>
      </footer>
    </div>
  );
}
