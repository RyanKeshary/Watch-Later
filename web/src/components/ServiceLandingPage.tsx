'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  ArrowRight,
  CheckCircle2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ServicePageProps {
  onSignInSuccess?: () => void;
  onEnterDashboard?: () => void;
  hasSession?: boolean;
}

export default function ServiceLandingPage({
  onSignInSuccess,
  onEnterDashboard,
  hasSession = false
}: ServicePageProps) {
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Download CTA state
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Active category tab for the Product Showcase
  const [showcaseCategory, setShowcaseCategory] = useState<'cooking' | 'design' | 'fitness'>('design');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('wl_downloaded') === 'true') {
      setHasDownloaded(true);
    }
  }, []);

  const handleDownloadClick = () => {
    if (hasDownloaded) {
      setShowAuthModal(true);
      return;
    }

    const link = document.createElement('a');
    link.href = '/watch-later.apk';
    link.download = 'watch-later.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('wl_downloaded', 'true');
    }

    setDownloadSuccess(true);
    setTimeout(() => {
      setHasDownloaded(true);
    }, 1800);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        onSignInSuccess?.();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          setShowAuthModal(false);
          onSignInSuccess?.();
        } else {
          setAuthError('Check your inbox to confirm your account, then sign in.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Share the reel',
      note: 'Native share sheet you use daily',
      body: 'No copying links into a notes file or texting yourself. Tap the Instagram share sheet, choose Watch Later, and continue reading.',
      detail: 'Direct OS share'
    },
    {
      num: '02',
      title: 'Captured silently',
      note: 'No dialogue box, zero interruption',
      body: 'Captured in milliseconds. If your reception drops, the share queues safely in local storage and syncs once signal returns.',
      detail: 'Offline queue'
    },
    {
      num: '03',
      title: 'Filed by topic',
      note: 'Transcripts parsed immediately',
      body: 'No manual folders. Machine intelligence extracts spoken speech and categorises each clip into structured libraries.',
      detail: 'Smart speech filter'
    },
    {
      num: '04',
      title: 'Ready for viewing',
      note: 'Organised library, never buried',
      body: 'A single calm surface instead of an endless saved backlog. Open a category, review key insights, and mark complete.',
      detail: 'Auto-cleaned queue'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white selection:text-black">
      {/* ========================================================================= */}
      {/* 1. NAVIGATION                                                             */}
      {/* ========================================================================= */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">Watch Later</span>

          <div>
            {hasSession ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="rounded border border-white/20 px-4 py-1.5 text-sm hover:bg-white hover:text-black transition-colors"
              >
                Go to Dashboard
              </button>
            ) : hasDownloaded ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="rounded border border-white/20 px-4 py-1.5 text-sm hover:bg-white hover:text-black transition-colors"
              >
                Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="rounded border border-white/20 px-4 py-1.5 text-sm hover:bg-white hover:text-black transition-colors"
              >
                Download
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO CONTENT                                                           */}
      {/* ========================================================================= */}
      <main className="mx-auto max-w-4xl px-6 py-20">
        <section className="mb-24">
          <p className="text-xs text-neutral-400 mb-4">Version 1.0 Flagship Release — Android APK &amp; Web</p>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Never lose a reel worth revisiting.
          </h1>
          <p className="text-lg text-neutral-300 max-w-2xl leading-relaxed mb-8">
            Reels sent to Watch Later are gathered silently and filed into focus queues.
          </p>

          <div className="mb-8">
            {downloadSuccess ? (
              <p className="text-sm text-emerald-400">
                APK Download initiated… Check notifications.
              </p>
            ) : hasDownloaded ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="rounded bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="rounded bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Download APK (Android)</span>
              </button>
            )}

            {(hasDownloaded || downloadSuccess) && (
              <p className="text-xs text-neutral-400 mt-2">
                First download complete. Sign in with the account you share clips from.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-neutral-400 pt-6 border-t border-white/10">
            <span>Android 8.0+ (Universal ARM64)</span>
            <span>Verified Package Signature</span>
            <span>Instant Cloud Sync</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. HOW IT WORKS CONTENT                                                   */}
        {/* ========================================================================= */}
        <section className="mb-24 pt-12 border-t border-white/10">
          <p className="text-xs text-neutral-400 mb-2">Process sequence</p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            One tap. Everything else is on autopilot.
          </h2>
          <p className="text-neutral-400 mb-10 max-w-xl">
            Follow the physical path from Instagram share sheet to clean library.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="border-t border-white/20 pt-4">
                <span className="text-xs text-neutral-500 block mb-2">{step.num} — {step.detail}</span>
                <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                <p className="text-sm text-neutral-400 mb-3">{step.note}</p>
                <p className="text-sm text-neutral-300 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. PARSING ENGINE / REEL SHOWCASE CONTENT                                */}
        {/* ========================================================================= */}
        <section className="mb-24 pt-12 border-t border-white/10">
          <p className="text-xs text-neutral-400 mb-2">Live reel processing</p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Inside the parsing engine.
          </h2>
          <p className="text-neutral-400 mb-6 max-w-xl">
            Zero clutter. Reels arrive quietly, audio transcripts generate, and essential takeaways are extracted.
          </p>

          {/* Category Tabs */}
          <div className="flex gap-4 mb-8 text-sm">
            {(['design', 'cooking', 'fitness'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setShowcaseCategory(cat)}
                className={`pb-1 border-b-2 transition-colors ${
                  showcaseCategory === cat
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {cat === 'design' ? 'Design & Visual' : cat === 'cooking' ? 'Cooking & Food' : 'Fitness & Form'}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {showcaseCategory === 'design' && (
              <>
                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@studiodesign</span>
                    <span>Captured 14m ago • 0:48 duration • Transcribed</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Concentric Radii in Mobile UI</h3>
                  <p className="text-sm text-neutral-300 mb-3 leading-relaxed">
                    Nested surfaces appear distorted when outer and inner containers share identical radius. Radius inner equals radius outer minus padding.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Key takeaway:</strong> Inner radius must subtract padding to preserve concentricity.
                  </p>
                </div>

                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@motioncrafter</span>
                    <span>Captured 2h ago • 1:12 duration • Transcribed</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Spring Physics vs Linear Easing</h3>
                  <p className="text-sm text-neutral-300 mb-3 leading-relaxed">
                    Linear transitions feel mechanical. Damped springs with stiffness 280 and damping 26 deliver physical weight.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Key takeaway:</strong> Reserve spring curves for gesture tracking; use bezier curves for simple opacity.
                  </p>
                </div>

                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@typefoundry</span>
                    <span>Captured 1d ago • 0:56 duration • Transcribed</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Editorial Line Heights &amp; Contrast</h3>
                  <p className="text-sm text-neutral-300 mb-3 leading-relaxed">
                    Display headers require tight leading paired with generous line spacing across continuous body text.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Key takeaway:</strong> Display sizes perform best with negative letter spacing and compact vertical rhythm.
                  </p>
                </div>
              </>
            )}

            {showcaseCategory === 'cooking' && (
              <>
                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@pasta.craft</span>
                    <span>Captured 3h ago • 0:45 duration • Recipe Extracted</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">The Real Carbonara Emulsion</h3>
                  <p className="text-sm text-neutral-300 mb-3 leading-relaxed">
                    Avoid heavy dairy. Combine starchy pasta water with cured pork fat and grated pecorino off the flame for velvet texture.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Core components:</strong> Guanciale, Egg yolks, Pecorino Romano, Coarse black pepper.
                  </p>
                </div>

                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@breadlab</span>
                    <span>Captured 5h ago • 1:04 duration • Recipe Extracted</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">No-Knead Overnight Focaccia</h3>
                  <p className="text-sm text-neutral-300 mb-3 leading-relaxed">
                    Eighty percent hydration dough resting twenty-four hours chilled. Deep oil indentation generates open crumb and blistered crust.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Rest schedule:</strong> 24h cold ferment in refrigerator, 2h room rise prior to baking.
                  </p>
                </div>

                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@culinarytechnique</span>
                    <span>Captured 1d ago • 0:52 duration • Recipe Extracted</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Steak Pan Sauce Deglaze</h3>
                  <p className="text-sm text-neutral-300 mb-3 leading-relaxed">
                    Dissolve fond with shallots and dry wine. Remove heat completely before incorporating cold cubed butter.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Technique:</strong> Cold butter mount stabilises the emulsion without splitting.
                  </p>
                </div>
              </>
            )}

            {showcaseCategory === 'fitness' && (
              <>
                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@biomechanics</span>
                    <span>Captured 4h ago • 0:39 duration • Form Cues Extracted</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Hip Wedge Setup for Deadlifts</h3>
                  <p className="text-sm text-neutral-300 mb-3 leading-relaxed">
                    Draw barbell slack out before initiating ground drive. Wedge hips into the bar instead of sinking into deep squat.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Movement cue:</strong> Engage latissimus dorsi as if protecting armpits before pull.
                  </p>
                </div>

                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@mobilityproject</span>
                    <span>Captured 8h ago • 0:49 duration • Form Cues Extracted</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Thoracic Spine Rotation Drills</h3>
                  <p className="text-sm text-neutral-300 mb-3 leading-relaxed">
                    Counter seated desk posture quickly. Quadruped reach-throughs restore upper spinal mobility for overhead movements.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Prescription:</strong> 8 controlled rotations per side with full exhalations.
                  </p>
                </div>

                <div className="border border-white/10 p-6 rounded">
                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    <span>@rehabspecialist</span>
                    <span>Captured 2d ago • 0:41 duration • Form Cues Extracted</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Shoulder External Rotator Cue</h3>
                  <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
                    Flared elbows impinge rotator cuff tendons. Keep elbow path near forty-five degrees and engage lower traps.
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Movement cue:</strong> Maintain neutral wrists and pull through the elbow joint.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. SUPPORTED FORMATS CONTENT                                              */}
        {/* ========================================================================= */}
        <section className="mb-24 pt-12 border-t border-white/10">
          <p className="text-xs text-neutral-400 mb-2">Cross-platform capture</p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            One library for every format you consume.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border border-white/10 p-5 rounded">
              <span className="text-xs text-neutral-400 block mb-1">Reels • 0.2s capture</span>
              <h3 className="text-lg font-bold mb-2">Instagram Reels</h3>
              <p className="text-sm text-neutral-300 mb-2">Visual recipes &amp; restaurant techniques</p>
              <span className="text-xs text-neutral-500">Native share sheet hook</span>
            </div>

            <div className="border border-white/10 p-5 rounded">
              <span className="text-xs text-neutral-400 block mb-1">TikTok • Immediate offline queue</span>
              <h3 className="text-lg font-bold mb-2">TikTok Videos</h3>
              <p className="text-sm text-neutral-300 mb-2">Engineering breakdowns &amp; fast UI micro-tutorials</p>
              <span className="text-xs text-neutral-500">Watermark-clean link ingestion</span>
            </div>

            <div className="border border-white/10 p-5 rounded">
              <span className="text-xs text-neutral-400 block mb-1">Shorts • Transcript parsed</span>
              <h3 className="text-lg font-bold mb-2">YouTube Shorts</h3>
              <p className="text-sm text-neutral-300 mb-2">Biomechanics, exercise form cues &amp; strength setup</p>
              <span className="text-xs text-neutral-500">Closed caption sync</span>
            </div>

            <div className="border border-white/10 p-5 rounded">
              <span className="text-xs text-neutral-400 block mb-1">YouTube • Chapter indexation</span>
              <h3 className="text-lg font-bold mb-2">Longform YouTube</h3>
              <p className="text-sm text-neutral-300 mb-2">Deep architectural walkthroughs &amp; podcast chapters</p>
              <span className="text-xs text-neutral-500">Full chaptering breakdown</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. THE DASHBOARD / PAYOFF CONTENT                                         */}
        {/* ========================================================================= */}
        <section className="mb-24 pt-12 border-t border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            No endless saved list. Just what matters.
          </h2>
          <p className="text-neutral-400 mb-8 max-w-xl">
            Instead of scrolling past hundreds of saved reels, select a dedicated subject and review what you saved.
          </p>

          <div className="space-y-4">
            <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <span className="text-xs text-neutral-500 mr-3">01</span>
                <span className="font-bold">Cooking &amp; Food</span>
                <p className="text-sm text-neutral-400 mt-1">Italian pasta technique, 3-minute sourdough prep, homemade bone broth.</p>
              </div>
              <span className="text-xs text-neutral-500 whitespace-nowrap">4 reels queued</span>
            </div>

            <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <span className="text-xs text-neutral-500 mr-3">02</span>
                <span className="font-bold">Design &amp; Visual</span>
                <p className="text-sm text-neutral-400 mt-1">Typography hierarchies, spatial motion principles, tactile interfaces.</p>
              </div>
              <span className="text-xs text-neutral-500 whitespace-nowrap">7 reels queued</span>
            </div>

            <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <span className="text-xs text-neutral-500 mr-3">03</span>
                <span className="font-bold">Fitness &amp; Recovery</span>
                <p className="text-sm text-neutral-400 mt-1">Shoulder mobility cues, deadlift mechanics, deep tissue recovery routines.</p>
              </div>
              <span className="text-xs text-neutral-500 whitespace-nowrap">3 reels queued</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FINAL CTA                                                              */}
        {/* ========================================================================= */}
        <section className="pt-12 border-t border-white/10 mb-12">
          <p className="text-xs text-neutral-400 mb-2">Ready for Android devices and web companions</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Never lose a reel worth revisiting.
          </h2>
          <p className="text-neutral-400 mb-8 max-w-lg">
            Create an account to activate your personal library before sharing your next clip.
          </p>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="rounded bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
          >
            <span>Create account</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex flex-wrap gap-4 text-xs text-neutral-500 mt-8">
            <span>Direct APK: 18.4 MB</span>
            <span>SHA-256 Verified</span>
            <span>Zero advertising trackers</span>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-4xl px-6 flex justify-between text-xs text-neutral-500">
          <span className="font-bold text-white">Watch Later</span>
          <span>Never lose a reel worth revisiting.</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* AUTH MODAL                                                                */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="relative w-full max-w-md rounded border border-white/20 bg-neutral-900 p-6 text-left text-white shadow-xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-xl font-bold mb-1">
              {authMode === 'signin' ? 'Welcome back' : 'Create account'}
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              {authMode === 'signin'
                ? 'Sign in to access your categorized reel library.'
                : 'Create your account to start auto-sorting your saved reels.'}
            </p>

            {authError && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded border border-white/20 bg-black px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded border border-white/20 bg-black px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded bg-white py-2.5 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {authLoading ? 'Authenticating…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-neutral-400">
              {authMode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-white underline"
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-white underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
