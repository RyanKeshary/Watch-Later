'use client';

import { useState } from 'react';
import {
  Sparkles,
  Smartphone,
  FolderTree,
  Zap,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Play,
  Film,
  Download,
  CheckCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  X
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
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      setShowAuthModal(false);
      onSignInSuccess?.();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const deliverables = [
    {
      num: '01',
      title: 'Zero-Friction Android & iOS Intercept',
      desc: 'Seamless system share-sheet capture. Tap share once inside Instagram, and the native background worker quietly captures and parses the reel with zero interruptions.',
      tag: 'CLIENT CORE'
    },
    {
      num: '02',
      title: 'Self-Organizing Semantic Taxonomy',
      desc: 'No manual tagging required. Our AI scans captions, topics, and transcripts to nest content into high-level pillars and hyper-specific sub-niches automatically.',
      tag: 'AI ENGINE'
    },
    {
      num: '03',
      title: 'Full Caption, Transcript & Title Extraction',
      desc: 'Never worry about deleted posts or altered links. All critical knowledge points, summaries, creators, and media thumbnails are permanently archived into your personal vault.',
      tag: 'EXTRACTION'
    },
    {
      num: '04',
      title: 'Adaptive Data Retention & Vault Cleansing',
      desc: 'Configurable automated life-cycles. Set automated 1-day, 1-week, or 1-month purge caps on watched archives, or perform single-click CSV ledger exports anytime.',
      tag: 'GOVERNANCE'
    }
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Share from Instagram',
      description: 'Tap the standard share button on any Instagram Reel, Post, or Carousel and select Watch Later.',
      badge: 'Zero-UI'
    },
    {
      step: '02',
      title: 'Automated Extraction',
      description: 'Our backend resolves original source metadata, thumbnails, captions, audio summaries, and creators in seconds.',
      badge: 'Background Daemon'
    },
    {
      step: '03',
      title: 'Intelligent Categorization',
      description: 'The engine inspects existing categories first, clustering similar reels without creating redundant duplicates.',
      badge: 'Smart Clustering'
    },
    {
      step: '04',
      title: 'Access & Curate Anywhere',
      description: 'Review your vault across responsive desktop and mobile browsers with list/grid density toggles and offline sync.',
      badge: 'Universal Sync'
    }
  ];

  const proofMetrics = [
    { value: '< 2.4s', label: 'End-to-End Extraction', sub: 'Average time from mobile share to vault availability' },
    { value: '100%', label: 'Private & Isolated', sub: 'PostgreSQL Row Level Security bound strictly to your user ID' },
    { value: '0 Clicks', label: 'Manual Tagging', sub: 'Fully autonomous categorization into logical pillars' },
    { value: '60 FPS', label: 'Native Performance', sub: 'Fluid spring animations with minimal bundle overhead' }
  ];

  const faqs = [
    {
      q: 'How does Watch Later capture Instagram reels without opening the app?',
      a: 'Watch Later registers a silent Android share intent (`ShareCaptureActivity`) that immediately records the reel URL into your cloud database and finishes in the background, keeping you right where you were inside Instagram.'
    },
    {
      q: 'Will it create duplicate categories for similar reels?',
      a: 'No. Watch Later employs strict categorization checks that evaluate existing categories first. It nests related reels together and only generates a new primary category or sub-niche when the content represents a genuinely new domain.'
    },
    {
      q: 'What happens if an Instagram Reel gets deleted or made private later?',
      a: 'Because Watch Later extracts and archives the title, creator handle, AI summary, full caption, and preview thumbnail upon share, your core knowledge and key points remain intact even if the original post is removed.'
    },
    {
      q: 'Can I export my curated library or clear out watched reels?',
      a: 'Yes. The Settings dashboard provides one-click CSV export of your entire library, configurable automated archive retention periods (1 Day / 1 Week / 1 Month), and safe bulk deletion tools.'
    }
  ];

  return (
    <div className="min-h-screen bg-fabric text-[#D9D9D9] font-sans antialiased selection:bg-[#333333] selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#333333] bg-[#0B0B0B]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Watch Later" className="h-8 w-8 rounded-lg object-cover border border-[#333333]" />
            <div>
              <span className="font-zolo text-lg font-bold tracking-tight text-white block leading-none">Watch Later</span>
              <span className="font-mono-micro text-[#6B6B6B] block mt-0.5">VAULT SERVICE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasSession ? (
              <button
                onClick={onEnterDashboard}
                className="flex items-center gap-2 rounded-lg bg-[#D9D9D9] px-4 py-2 text-xs font-semibold text-[#0B0B0B] transition hover:bg-white active:scale-95"
              >
                <span>Enter Vault</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-[#D9D9D9] px-4 py-2 text-xs font-semibold text-[#0B0B0B] transition hover:bg-white active:scale-95"
              >
                <span>Access Vault</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION: Service-Specific Value Proposition */}
      <section className="relative overflow-hidden border-b border-[#333333] pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#333333] bg-[#1A1A1A]/80 px-3.5 py-1 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span className="font-mono-micro text-[#D9D9D9]">AUTONOMOUS CONTENT REEL VAULT &amp; EXTRACTION SERVICE</span>
          </div>

          <h1 className="font-zolo text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Never lose a reel worth revisiting.
          </h1>

          <p className="mt-6 text-sm sm:text-base lg:text-lg text-[#999999] max-w-2xl mx-auto leading-relaxed">
            The private archive service engineered to capture, scrape, and intelligently categorize Instagram media directly from your phone share sheet with zero friction.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (hasSession) onEnterDashboard?.();
                else {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:bg-[#D9D9D9] active:scale-95 shadow-lg"
            >
              <span>{hasSession ? 'Open Your Vault' : 'Start Archiving Free'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href="#deliverables"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#1A1A1A]/70 px-6 py-3.5 text-sm font-medium text-[#D9D9D9] transition hover:bg-[#1A1A1A] hover:border-[#6B6B6B]"
            >
              <span>Explore Deliverables</span>
              <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
            </a>
          </div>

          {/* Interactive Feature Hero Preview Mockup */}
          <div className="mt-16 rounded-2xl border border-[#333333] bg-[#1A1A1A]/90 p-4 sm:p-6 shadow-2xl text-left max-w-4xl mx-auto backdrop-blur">
            <div className="flex items-center justify-between border-b border-[#333333] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#333333]" />
                <div className="h-3 w-3 rounded-full bg-[#333333]" />
                <div className="h-3 w-3 rounded-full bg-[#333333]" />
                <span className="font-mono-micro text-[#6B6B6B] ml-2">VAULT_PIPELINE // ACTIVE_SESSION</span>
              </div>
              <span className="font-mono-micro text-white bg-[#0B0B0B] px-2.5 py-0.5 rounded border border-[#333333]">
                SYNCHRONIZED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-[#333333] bg-[#0B0B0B]">
                <span className="font-mono-micro text-[#6B6B6B] block mb-1">INPUT SOURCE</span>
                <p className="text-xs font-semibold text-white">Instagram Share Sheet</p>
                <p className="text-[11px] text-[#6B6B6B] mt-1">Silent background intercept</p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#333333] bg-[#0B0B0B]">
                <span className="font-mono-micro text-[#6B6B6B] block mb-1">SCRAPER PIPELINE</span>
                <p className="text-xs font-semibold text-white">Captions, AI Summary, Tags</p>
                <p className="text-[11px] text-[#6B6B6B] mt-1">First-class entity parsing</p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#333333] bg-[#0B0B0B]">
                <span className="font-mono-micro text-[#6B6B6B] block mb-1">DESTINATION</span>
                <p className="text-xs font-semibold text-white">Clustered Knowledge Pillar</p>
                <p className="text-[11px] text-[#6B6B6B] mt-1">Zero redundant categories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CLEAR SERVICE EXPECTATIONS */}
      <section className="border-b border-[#333333] py-20 bg-[#0B0B0B]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[SPECIFICATIONS &amp; BOUNDARIES]</span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Clear Service Expectations
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#999999] leading-relaxed">
              We define exact operational commitments so you know precisely how your media is processed, stored, and protected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6">
              <div className="h-10 w-10 rounded-xl bg-[#0B0B0B] border border-[#333333] flex items-center justify-center text-white mb-4">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="font-zolo text-base font-bold text-white mb-2">Native Mobile Independence</h3>
              <p className="text-xs text-[#999999] leading-relaxed">
                No awkward copy-pasting into chat bots or web forms. You share directly from your device’s system share dialog without ever breaking your reading stride.
              </p>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6">
              <div className="h-10 w-10 rounded-xl bg-[#0B0B0B] border border-[#333333] flex items-center justify-center text-white mb-4">
                <FolderTree className="h-5 w-5" />
              </div>
              <h3 className="font-zolo text-base font-bold text-white mb-2">Clean Taxonomy Discipline</h3>
              <p className="text-xs text-[#999999] leading-relaxed">
                Categories are kept coherent. The engine matches against pre-existing domain roots and only spawns new niches when reels represent entirely novel subjects.
              </p>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6">
              <div className="h-10 w-10 rounded-xl bg-[#0B0B0B] border border-[#333333] flex items-center justify-center text-white mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-zolo text-base font-bold text-white mb-2">Zero Tracking &amp; Strict RLS</h3>
              <p className="text-xs text-[#999999] leading-relaxed">
                Every saved post and extracted insight is walled behind authenticated Supabase Row Level Security. We never sell, train on, or advertise with your saves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONCRETE DELIVERABLES */}
      <section id="deliverables" className="border-b border-[#333333] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-4">
            <div>
              <span className="font-mono-micro text-[#6B6B6B] block mb-2">[CORE CAPABILITIES]</span>
              <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Concrete Deliverables
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#999999] max-w-md">
              What you receive the moment you link your device to the Watch Later vault.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliverables.map((item) => (
              <div
                key={item.num}
                className="group relative rounded-2xl border border-[#333333] bg-[#1A1A1A]/90 p-6 sm:p-8 hover:border-[#6B6B6B] transition shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono-micro text-[#6B6B6B]">{item.num} {'//'} DELIVERABLE</span>
                  <span className="font-mono-micro text-white bg-[#0B0B0B] px-2 py-0.5 rounded border border-[#333333]">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-zolo text-xl font-bold text-white tracking-tight mb-2 group-hover:text-white transition">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#999999] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROCESS TRANSPARENCY: Step-by-Step Architecture */}
      <section className="border-b border-[#333333] py-20 bg-[#0B0B0B]/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[WORKFLOW TRANSPARENCY]</span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Our 4-Stage Extraction Process
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#999999]">
              How a single tap on your mobile phone turns into an organized knowledge library.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div key={step.step} className="relative rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-zolo text-2xl font-bold text-white">{step.step}</span>
                    <span className="font-mono-micro text-[#6B6B6B] border border-[#333333] px-1.5 py-0.5 rounded bg-[#0B0B0B]">
                      {step.badge}
                    </span>
                  </div>
                  <h4 className="font-zolo text-base font-semibold text-white mb-2">{step.title}</h4>
                  <p className="text-xs text-[#999999] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. RESULTS & PROOF */}
      <section className="border-b border-[#333333] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[VERIFIED BENCHMARKS]</span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Numbers &amp; Engineering Proof
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {proofMetrics.map((metric, i) => (
              <div key={i} className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6 text-center">
                <div className="font-zolo text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2">
                  {metric.value}
                </div>
                <div className="text-xs font-semibold text-[#D9D9D9] mb-1">{metric.label}</div>
                <p className="text-[11px] text-[#6B6B6B] leading-tight">{metric.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CLEAR DIFFERENTIATOR */}
      <section className="border-b border-[#333333] py-20 bg-[#0B0B0B]/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="font-mono-micro text-[#6B6B6B] block mb-2">[SIGNATURE DIFFERENTIATOR]</span>
          <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Built for Knowledge Workers, Not Casual Bookmarkers
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-[#999999] max-w-2xl mx-auto leading-relaxed">
            Standard Instagram bookmarking buries high-value tutorials and references into an unsearchable grid. Watch Later extracts the actual knowledge, summarizes key takeaways, and categorizes them automatically.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="rounded-2xl border border-red-950/40 bg-red-950/10 p-6">
              <span className="font-mono-micro text-red-400 block mb-2">✕ DEFAULT INSTAGRAM SAVES</span>
              <ul className="space-y-2 text-xs text-[#999999]">
                <li>• Cluttered, unorganized chronological grid</li>
                <li>• Lost forever if creator edits caption or removes reel</li>
                <li>• Zero export capability or automated cleanup</li>
                <li>• No searchable AI summaries or creator tags</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/90 p-6">
              <span className="font-mono-micro text-white block mb-2">✓ WATCH LATER VAULT</span>
              <ul className="space-y-2 text-xs text-[#D9D9D9]">
                <li>• Hierarchical topic pillars and smart sub-niches</li>
                <li>• Full caption, creator metadata &amp; AI breakdown preserved</li>
                <li>• One-click CSV export and retention cap auto-cleansing</li>
                <li>• High-performance, distraction-free desktop/mobile app</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. OBJECTION HANDLING & FAQ */}
      <section className="border-b border-[#333333] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[OBJECTION HANDLING]</span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 overflow-hidden transition"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left transition hover:bg-[#1A1A1A]"
                  >
                    <span className="font-zolo text-sm font-semibold text-white pr-4">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-[#6B6B6B] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#999999] leading-relaxed border-t border-[#333333]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CTA CALL-TO-ACTION */}
      <section className="py-24 bg-[#0B0B0B] text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-zolo text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Stop losing valuable content today.
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-[#999999] max-w-xl mx-auto">
            Create your private vault in less than 30 seconds and connect your devices.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                if (hasSession) onEnterDashboard?.();
                else {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-[#D9D9D9] active:scale-95 shadow-2xl"
            >
              <span>{hasSession ? 'Go To Vault Dashboard' : 'Create Free Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#333333] py-8 text-center text-xs text-[#6B6B6B]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Watch Later" className="h-5 w-5 rounded object-cover" />
            <span className="font-zolo font-semibold text-white">Watch Later</span>
            <span>— Never lose a reel worth revisiting.</span>
          </div>
          <span className="font-mono-micro">AUTONOMOUS MEDIA ARCHIVING SERVICE</span>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-up"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#333333] bg-[#1A1A1A] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
                <span className="font-zolo text-lg font-bold text-white">Watch Later</span>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[#6B6B6B] hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-zolo text-xl font-bold text-white mb-1">
              {authMode === 'signin' ? 'Sign in to your Vault' : 'Create your Vault Account'}
            </h3>
            <p className="text-xs text-[#999999] mb-6">
              {authMode === 'signin' ? 'Enter your credentials to access your saved library.' : 'Free instant setup. Zero credit card required.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#999999]">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-2 text-sm text-white placeholder-[#6B6B6B] focus:border-[#D9D9D9] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#999999]">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-2 pr-10 text-sm text-white placeholder-[#6B6B6B] focus:border-[#D9D9D9] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#6B6B6B] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="rounded-lg bg-red-950/40 p-3 text-xs text-red-400 border border-red-800/40">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-lg bg-[#D9D9D9] text-[#0B0B0B] py-2.5 text-sm font-semibold transition hover:bg-white active:scale-[0.99] disabled:opacity-50"
              >
                {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
                className="text-xs text-[#999999] hover:text-white transition"
              >
                {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
