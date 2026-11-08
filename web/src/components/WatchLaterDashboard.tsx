'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWatchLater, NavPage, isAllContentReel, isInboxReel } from '@/context/WatchLaterContext';
import { supabase } from '@/lib/supabase';
import { Reel } from '@/types/database';
import { Morph, Loading } from 'loading-dev';
import ServiceLandingPage from '@/components/ServiceLandingPage';
import GameOnboardingGuide from '@/components/GameOnboardingGuide';
import { NumberTicker } from '@/components/NumberTicker';
import {
  Home,
  Film,
  FolderTree,
  Folder,
  Inbox,
  AlertTriangle,
  Check,
  CheckCircle,
  Archive,
  Settings as SettingsIcon,
  RefreshCw,
  ExternalLink,
  Search,
  LogOut,
  Bookmark,
  RotateCcw,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Pin,
  PinOff,
  Clock,
  Tag,
  User,
  Palette,
  Download,
  Smartphone,
  X,
  Play,
  Eye,
  EyeOff,
  Bell,
  PieChart,
  Filter,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Info,
  Edit2,
  BookmarkCheck,
  Compass,
  Star,
  Sparkles,
  BookOpen,
  Code,
  Music,
  Camera,
  Coffee,
  Heart,
  Briefcase,
  Flame,
  Globe,
  Dumbbell,
  Lightbulb,
  Cpu,
  GraduationCap,
  Menu,
  Gamepad2,
  Tv,
  Headphones,
  ShoppingBag,
  Car,
  Plane,
  Utensils,
  Trophy,
  Zap,
  Video,
  DollarSign,
  Mountain,
  Trees,
  Shield,
  Smile,
  Newspaper,
  Rocket,
  Wrench
} from 'lucide-react';

interface WatchLaterDashboardProps {
  activePage: NavPage;
}

const COLOR_PRESETS = [
  { id: 'default', name: 'Original', bg: 'bg-[#1A1A1A]', text: 'text-zinc-200', border: 'border-[#333333]', hex: '#9CA3AF' },
  { id: 'white', name: 'Silver White', bg: 'bg-white/10', text: 'text-white', border: 'border-white/30', hex: '#FFFFFF' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#34D399' },
  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', hex: '#22D3EE' },
  { id: 'purple', name: 'Violet', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', hex: '#C084FC' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', hex: '#FBBF24' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', hex: '#FB7185' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', hex: '#60A5FA' },
  { id: 'orange', name: 'Orange', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', hex: '#FB923C' },
  { id: 'lime', name: 'Lime', bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30', hex: '#A3E635' },
  { id: 'fuchsia', name: 'Fuchsia', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', hex: '#E879F9' }
];

const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
  Star: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Sparkles: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Bookmark: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  BookmarkCheck: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Compass: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  BookOpen: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Tag: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  Code: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  Music: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Camera: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  Coffee: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Heart: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  Briefcase: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  Flame: { bg: 'bg-orange-600/10', text: 'text-orange-500', border: 'border-orange-500/30' },
  Globe: { bg: 'bg-emerald-600/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Dumbbell: { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30' },
  Lightbulb: { bg: 'bg-amber-400/10', text: 'text-amber-300', border: 'border-amber-400/30' },
  Cpu: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  GraduationCap: { bg: 'bg-blue-600/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Folder: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  Film: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  Gamepad2: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Tv: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  Headphones: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  Palette: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  ShoppingBag: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Car: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Plane: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  Utensils: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Trophy: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  Zap: { bg: 'bg-amber-400/10', text: 'text-amber-300', border: 'border-amber-400/30' },
  Video: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  DollarSign: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Mountain: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  Trees: { bg: 'bg-green-600/10', text: 'text-green-400', border: 'border-green-500/30' },
  Shield: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Smile: { bg: 'bg-yellow-400/10', text: 'text-yellow-300', border: 'border-yellow-400/30' },
  Newspaper: { bg: 'bg-zinc-400/10', text: 'text-zinc-300', border: 'border-zinc-400/30' },
  Rocket: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  Wrench: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' }
};

const getCategoryTheme = (iconName?: string, customColor?: string) => {
  if (customColor && customColor !== 'default') {
    const preset = COLOR_PRESETS.find(p => p.id === customColor);
    if (preset) return { bg: preset.bg, text: preset.text, border: preset.border };
  }
  return categoryColorMap[iconName || 'Folder'] || categoryColorMap.Folder;
};

const renderCategoryIcon = (iconName?: string, className: string = 'h-10 w-10 text-[#D9D9D9]') => {
  switch (iconName) {
    case 'Star': return <Star className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Bookmark': return <Bookmark className={className} />;
    case 'BookmarkCheck': return <BookmarkCheck className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Tag': return <Tag className={className} />;
    case 'Code': return <Code className={className} />;
    case 'Music': return <Music className={className} />;
    case 'Camera': return <Camera className={className} />;
    case 'Coffee': return <Coffee className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Briefcase': return <Briefcase className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Dumbbell': return <Dumbbell className={className} />;
    case 'Lightbulb': return <Lightbulb className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'GraduationCap': return <GraduationCap className={className} />;
    case 'Film': return <Film className={className} />;
    case 'Gamepad2': return <Gamepad2 className={className} />;
    case 'Tv': return <Tv className={className} />;
    case 'Headphones': return <Headphones className={className} />;
    case 'Palette': return <Palette className={className} />;
    case 'ShoppingBag': return <ShoppingBag className={className} />;
    case 'Car': return <Car className={className} />;
    case 'Plane': return <Plane className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Video': return <Video className={className} />;
    case 'DollarSign': return <DollarSign className={className} />;
    case 'Mountain': return <Mountain className={className} />;
    case 'Trees': return <Trees className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Smile': return <Smile className={className} />;
    case 'Newspaper': return <Newspaper className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    default: return <Folder className={className} />;
  }
};

// Shared IntersectionObserver pool for card virtualization
// Loads what is on screen and 20% of vh before & 20% after
const cardObserverMap = new Map<Element, (inView: boolean) => void>();
let sharedCardObserver: IntersectionObserver | null = null;

function getSharedCardObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCardObserver) {
    sharedCardObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = cardObserverMap.get(entry.target);
          if (cb) {
            cb(entry.isIntersecting);
          }
        }
      },
      {
        root: null, // viewport
        rootMargin: '20px 0px 20px 0px', // instantly load/unload as it comes/goes of screen
      }
    );
  }
  return sharedCardObserver;
}

function VirtualCardContainer({
  children,
  minHeight,
  aspectRatio,
  isForceMounted = false,
  className = '',
  placeholderClassName = '',
}: {
  children: React.ReactNode;
  minHeight?: string;
  aspectRatio?: string;
  isForceMounted?: boolean;
  className?: string;
  placeholderClassName?: string;
}) {
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = getSharedCardObserver();
    if (!observer) return;

    const onIntersect = (inView: boolean) => {
      setIsInViewport(inView);
    };

    cardObserverMap.set(el, onIntersect);
    observer.observe(el);

    return () => {
      cardObserverMap.delete(el);
      observer.unobserve(el);
    };
  }, []);

  const shouldRender = isInViewport || isForceMounted;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...(minHeight ? { minHeight } : {}),
        ...(aspectRatio ? { aspectRatio } : {}),
      }}
    >
      {shouldRender ? (
        children
      ) : (
        <div
          className={`w-full h-full rounded-2xl border border-white/[0.08] bg-[#121214] p-4 flex flex-col justify-between overflow-hidden shadow-sm relative group/skeleton ${placeholderClassName}`}
          aria-hidden="true"
        >
          {/* Subtle boneyard shimmer sweep */}
          <div className="absolute inset-0 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

          {/* Top Bar Skeleton */}
          <div className="flex items-center justify-between w-full relative z-10">
            <div className="h-4 w-16 rounded-full bg-white/[0.08] animate-pulse" />
            <div className="h-6 w-6 rounded-lg bg-white/[0.08] animate-pulse" />
          </div>

          {/* Middle Media Silhouette */}
          <div className="my-auto flex items-center justify-center relative z-10">
            <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center animate-pulse">
              <Play className="h-5 w-5 text-white/20 ml-0.5" />
            </div>
          </div>

          {/* Bottom Title & Summary Bones */}
          <div className="w-full space-y-2 pt-2 relative z-10">
            <div className="h-3.5 w-4/5 rounded bg-white/[0.12] animate-pulse" />
            <div className="h-2.5 w-full rounded bg-white/[0.06] animate-pulse" />
            <div className="h-2.5 w-3/5 rounded bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function WatchLaterDashboard({ activePage }: WatchLaterDashboardProps) {
  const router = useRouter();
  const currentPage = activePage;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    session,
    loading,
    refreshing,
    reels,
    setReels,
    categories,
    setCategories,
    devices,
    savedLaterIds,
    setSavedLaterIds,
    pinnedFolderIds,
    counts,
    rootCategories,
    pinnedCategories,
    savesFolderIds,
    savesFolders,
    handleCreateSaveFolder,
    toggleSaveReel,
    loadData,
    incomingAlert,
    lastMoveAction,
    undoLastMove,
    handleStatusChange,
    handleDeleteReel,
    handleRetryExtraction,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleDropOnCategory,
    togglePinFolder,
    retryingId,
    density,
    setDensity,
    showThumbnails,
    setShowThumbnails,
    showPersonaInsights,
    setShowPersonaInsights,
    isFirstTimePersona,
    dismissFirstTimePersona,
    userPersonaInsight,
    sidebarCollapsed,
    setSidebarCollapsed,
    retentionPeriod,
    setRetentionPeriod,
    viewLayout,
    updateViewLayout,
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    postTypeFilter,
    setPostTypeFilter,
    selectedCategoryId,
    setSelectedCategoryId,
    activeCardMenuId,
    setActiveCardMenuId,
    draggedItem,
    setDraggedItem,
    dragOverCatId,
    setDragOverCatId,
    detailReelId,
    setDetailReelId,
    detailReel,
    editingCategory,
    setEditingCategory,
    editCategoryName,
    setEditCategoryName,
    editCategoryIcon,
    setEditCategoryIcon,
    editCategoryColor,
    setEditCategoryColor,
    editCategoryDesc,
    setEditCategoryDesc,
    categoryMetaMap,
    showGameGuide,
    setShowGameGuide,
    handleCompleteGameGuide,
    showClearHistoryLightbox,
    setShowClearHistoryLightbox,
    isClearingHistory,
    clearCategoriesAlso,
    setClearCategoriesAlso,
    handleConfirmClearHistory,
    newCategoryName,
    setNewCategoryName,
    isCreatingCategory,
    setIsCreatingCategory,
    categoryInsertPending,
    newPassword,
    setNewPassword,
    showNewPassword,
    setShowNewPassword,
    passwordMsg,
    handleChangePassword,
    handleRemoveDevice,
    exportData
  } = useWatchLater();

  // Saves page folder creation state
  const [isCreatingSaveFolder, setIsCreatingSaveFolder] = useState(false);
  const [newSaveFolderName, setNewSaveFolderName] = useState('');

  // Niche Category Breakdown view format: 'bars' | 'pie'
  const [nicheViewMode, setNicheViewMode] = useState<'bars' | 'pie'>('bars');
  const [hoveredPieCatId, setHoveredPieCatId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('watchlater_niche_view_mode');
      if (savedMode === 'bars' || savedMode === 'pie') {
        setNicheViewMode(savedMode);
      }
    } catch (e) { }
  }, []);

  const updateNicheViewMode = (mode: 'bars' | 'pie') => {
    setNicheViewMode(mode);
    try {
      localStorage.setItem('watchlater_niche_view_mode', mode);
    } catch (e) { }
  };

  // Animation state for Niche Category Breakdown bars & counters
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [pieAnimated, setPieAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setBarsAnimated(true);
      setPieAnimated(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // If unauthenticated on a subpage, route to /
  useEffect(() => {
    if (!loading && !session && activePage !== 'home') {
      router.replace('/');
    }
  }, [loading, session, activePage, router]);

  // Click outside listener for 3-dot dropdowns
  useEffect(() => {
    const handleClickOutside = () => setActiveCardMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [setActiveCardMenuId]);

  // Global Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailReelId) setDetailReelId(null);
        if (editingCategory) setEditingCategory(null);
        if (showClearHistoryLightbox && !isClearingHistory) setShowClearHistoryLightbox(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailReelId, editingCategory, showClearHistoryLightbox, isClearingHistory, setDetailReelId, setEditingCategory, setShowClearHistoryLightbox]);

  // Filtered Reels
  const displayedReels = useMemo(() => {
    return reels.filter((reel) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = reel.ai_title?.toLowerCase().includes(q);
        const descMatch = reel.ai_description?.toLowerCase().includes(q);
        const sumMatch = reel.ai_summary?.toLowerCase().includes(q);
        const capMatch = reel.caption?.toLowerCase().includes(q);
        const userMatch = reel.creator_username?.toLowerCase().includes(q);
        const urlMatch = reel.url.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !sumMatch && !capMatch && !userMatch && !urlMatch) {
          return false;
        }
      }

      if (postTypeFilter !== 'all') {
        const isReel = reel.url.includes('/reel/') || reel.url.includes('/reels/');
        const isCarousel = reel.caption?.toLowerCase().includes('carousel') || (reel.raw_shared_text?.includes('CAROUSEL'));
        if (postTypeFilter === 'reels' && !isReel) return false;
        if (postTypeFilter === 'carousels' && !isCarousel) return false;
        if (postTypeFilter === 'posts' && (isReel || isCarousel)) return false;
      }

      switch (currentPage) {
        case 'all':
          return isAllContentReel(reel);
        case 'savelater':
        case 'saves':
          if (!savedLaterIds.includes(reel.id)) return false;
          if (selectedCategoryId) {
            return reel.category_id === selectedCategoryId || reel.subcategory_id === selectedCategoryId;
          }
          // Cut from root: only show reels not moved into any saves folder
          return !reel.category_id || !savesFolderIds.includes(reel.category_id);
        case 'watched':
          return reel.completion_status === 'completed';
        case 'inbox':
          return isInboxReel(reel);
        case 'failed':
          return reel.is_failed || reel.processing_status === 'extraction_failed';
        case 'archived':
          return reel.completion_status === 'archived';
        case 'categories':
          if (!selectedCategoryId) return false;
          return reel.category_id === selectedCategoryId || reel.subcategory_id === selectedCategoryId;
        default:
          return true;
      }
    });
  }, [reels, currentPage, selectedCategoryId, searchQuery, postTypeFilter, savedLaterIds, savesFolderIds]);

  // Hover-expand state for collapsed navbar with 0.25s intent delay
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isEffectiveExpanded = !sidebarCollapsed || isSidebarHovered;
  const sidebarHoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSidebarMouseEnter = () => {
    if (!sidebarCollapsed) return;
    if (sidebarHoverTimerRef.current) clearTimeout(sidebarHoverTimerRef.current);
    sidebarHoverTimerRef.current = setTimeout(() => {
      setIsSidebarHovered(true);
    }, 250);
  };

  const handleSidebarMouseLeave = () => {
    if (sidebarHoverTimerRef.current) {
      clearTimeout(sidebarHoverTimerRef.current);
      sidebarHoverTimerRef.current = null;
    }
    setIsSidebarHovered(false);
  };

  useEffect(() => {
    return () => {
      if (sidebarHoverTimerRef.current) {
        clearTimeout(sidebarHoverTimerRef.current);
      }
    };
  }, []);

  // Windowed visible loading for instant response & 0-lag rendering
  const [visibleCount, setVisibleCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(24);
  }, [currentPage, selectedCategoryId, searchQuery, postTypeFilter]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 20, displayedReels.length));
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [displayedReels.length, visibleCount, viewLayout]);

  const renderedReels = useMemo(() => {
    return displayedReels.slice(0, visibleCount);
  }, [displayedReels, visibleCount]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-fabric text-white">
        <div className="flex flex-col items-center gap-4">
          <Loading size={48} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <ServiceLandingPage
        hasSession={false}
        onSignInSuccess={() => loadData()}
        onEnterDashboard={() => loadData()}
      />
    );
  }

  return (
    <div className="flex h-screen bg-fabric text-[#D9D9D9] font-sans antialiased">
      {/* Toast Alert for Incoming Reels & Undoable Actions */}
      {incomingAlert && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-white/20 bg-[#141414]/90 backdrop-blur-2xl px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] animate-fade-up">
          <Bell className="h-4 w-4 text-cyan-400 shrink-0 animate-pulse" />
          <div className="min-w-0 pr-1">
            <p className="text-xs font-semibold text-white">Notice</p>
            <p className="text-[11px] text-[#A8A8A8] truncate max-w-xs">{incomingAlert}</p>
          </div>
          {lastMoveAction && (
            <button
              onClick={undoLastMove}
              className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-2.5 py-1 rounded-lg transition active:scale-95 shrink-0"
              title="Undo this move"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Backdrop for Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className={`${isEffectiveExpanded ? 'w-[250px] md:w-[250px] lg:w-[260px] xl:w-[270px]' : 'w-[250px] md:w-16'
          } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } fixed md:static inset-y-0 left-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-r border-[#333333] bg-[#0B0B0B]/95 md:bg-[#0B0B0B]/85 backdrop-blur-xl px-2 py-3 flex flex-col justify-between select-none shrink-0 ${
            sidebarCollapsed && isSidebarHovered ? 'shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-50' : ''
          }`}
      >
        <div className="overflow-y-auto overflow-x-hidden flex flex-col">
          {/* Logo & Toggle Header */}
          <div className="mb-3 flex items-center justify-between min-h-[44px] px-1">
            <button
              onClick={() => { router.push('/'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition text-left group min-w-0"
              title="Return to Home"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Watch Later"
                  className="h-8 w-8 object-contain shrink-0 group-hover:scale-105 transition-all drop-shadow"
                />
              </div>
              <div className={`min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden whitespace-nowrap ${
                isEffectiveExpanded ? 'max-w-[150px] opacity-100 ml-1' : 'max-w-0 opacity-0 pointer-events-none'
              }`}>
                <span className="font-oughter text-base sm:text-lg font-bold tracking-tight text-white block leading-none">
                  Watch Later
                </span>
                <span className="text-[9px] text-[#7E7E7E] block leading-tight mt-0.5 truncate">
                  Never lose a reel worth revisiting.
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setSidebarCollapsed(!sidebarCollapsed);
                  setIsSidebarHovered(false);
                }}
                className={`hidden md:inline-flex p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition active:scale-95 ${!isEffectiveExpanded ? '!hidden' : ''}`}
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className={`md:hidden p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition ${mobileMenuOpen ? '!inline-flex' : ''}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1.5">
            <button
              onClick={() => { router.push('/'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${!isEffectiveExpanded ? 'justify-center px-0' : 'justify-start px-2.5 gap-3'} rounded-xl py-2 text-xs font-medium transition-all ${
                currentPage === 'home'
                  ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] animate-in fade-in duration-200'
                  : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D9D9D9] border border-transparent'
              }`}
              title="Home (Stats & Insights)"
            >
              <div className="w-10 h-7 flex items-center justify-center shrink-0">
                <Home className={`h-5 w-5 transition-transform duration-200 ${currentPage === 'home' ? 'text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-[#888888]'}`} />
              </div>
              <span className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
                isEffectiveExpanded ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
              }`}>Home</span>
            </button>

            <button
              onClick={() => { router.push('/allcontent'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${!isEffectiveExpanded ? 'justify-center px-0' : 'justify-between px-2.5'} rounded-xl py-2 text-xs font-medium transition-all ${
                currentPage === 'all' && !selectedCategoryId
                  ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] animate-in fade-in duration-200'
                  : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D9D9D9] border border-transparent'
              }`}
              title="All Content"
            >
              <div className="flex items-center min-w-0">
                <div className="w-10 h-7 flex items-center justify-center shrink-0">
                  <Film className={`h-5 w-5 transition-transform duration-200 ${currentPage === 'all' && !selectedCategoryId ? 'text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-[#888888]'}`} />
                </div>
                <span className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
                  isEffectiveExpanded ? 'max-w-[120px] opacity-100 ml-3' : 'max-w-0 opacity-0 pointer-events-none'
                }`}>All Content</span>
              </div>
              <span className={`font-mono text-[10px] text-[#6B6B6B] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden whitespace-nowrap ${
                isEffectiveExpanded ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
              }`}>{counts.all}</span>
            </button>

            {/* Categories Navigation */}
            <button
              onClick={() => { router.push('/categories'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${!isEffectiveExpanded ? 'justify-center px-0' : 'justify-between px-2.5'} rounded-xl py-2 text-xs font-medium transition-all ${
                currentPage === 'categories' && !selectedCategoryId
                  ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] animate-in fade-in duration-200'
                  : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D9D9D9] border border-transparent'
              }`}
              title="Categories"
            >
              <div className="flex items-center min-w-0">
                <div className="w-10 h-7 flex items-center justify-center shrink-0">
                  <FolderTree className={`h-5 w-5 transition-transform duration-200 ${currentPage === 'categories' && !selectedCategoryId ? 'text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-[#888888]'}`} />
                </div>
                <span className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
                  isEffectiveExpanded ? 'max-w-[120px] opacity-100 ml-3' : 'max-w-0 opacity-0 pointer-events-none'
                }`}>Categories</span>
              </div>
              <span className={`font-mono text-[10px] text-[#6B6B6B] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden whitespace-nowrap ${
                isEffectiveExpanded ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
              }`}>{counts.categories}</span>
            </button>

            {/* Saves Page */}
            <button
              onClick={() => { router.push('/saves'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${!isEffectiveExpanded ? 'justify-center px-0' : 'justify-between px-2.5'} rounded-xl py-2 text-xs font-medium transition-all ${
                (currentPage === 'savelater' || currentPage === 'saves')
                  ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] animate-in fade-in duration-200'
                  : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D9D9D9] border border-transparent'
              }`}
              title="Saves"
            >
              <div className="flex items-center min-w-0">
                <div className="w-10 h-7 flex items-center justify-center shrink-0">
                  <Bookmark className={`h-5 w-5 transition-transform duration-200 ${(currentPage === 'savelater' || currentPage === 'saves') ? 'text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-[#888888]'}`} />
                </div>
                <span className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
                  isEffectiveExpanded ? 'max-w-[120px] opacity-100 ml-3' : 'max-w-0 opacity-0 pointer-events-none'
                }`}>Saves</span>
              </div>
              <span className={`font-mono text-[10px] text-[#6B6B6B] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden whitespace-nowrap ${
                isEffectiveExpanded ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
              }`}>{counts.savelater}</span>
            </button>

            <button
              onClick={() => { router.push('/watched'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${!isEffectiveExpanded ? 'justify-center px-0' : 'justify-between px-2.5'} rounded-xl py-2 text-xs font-medium transition-all ${
                currentPage === 'watched'
                  ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] animate-in fade-in duration-200'
                  : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D9D9D9] border border-transparent'
              }`}
              title="Watched"
            >
              <div className="flex items-center min-w-0">
                <div className="w-10 h-7 flex items-center justify-center shrink-0">
                  <CheckCircle className={`h-5 w-5 transition-transform duration-200 ${currentPage === 'watched' ? 'text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-[#888888]'}`} />
                </div>
                <span className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
                  isEffectiveExpanded ? 'max-w-[120px] opacity-100 ml-3' : 'max-w-0 opacity-0 pointer-events-none'
                }`}>Watched</span>
              </div>
              <span className={`font-mono text-[10px] text-[#6B6B6B] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden whitespace-nowrap ${
                isEffectiveExpanded ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
              }`}>{counts.watched}</span>
            </button>

            <button
              onClick={() => { router.push('/inbox'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${!isEffectiveExpanded ? 'justify-center px-0' : 'justify-between px-2.5'} rounded-xl py-2 text-xs font-medium transition-all ${
                currentPage === 'inbox'
                  ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] animate-in fade-in duration-200'
                  : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D9D9D9] border border-transparent'
              }`}
              title="Inbox"
            >
              <div className="flex items-center min-w-0">
                <div className="w-10 h-7 flex items-center justify-center shrink-0">
                  <Inbox className={`h-5 w-5 transition-transform duration-200 ${currentPage === 'inbox' ? 'text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-[#888888]'}`} />
                </div>
                <span className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
                  isEffectiveExpanded ? 'max-w-[120px] opacity-100 ml-3' : 'max-w-0 opacity-0 pointer-events-none'
                }`}>Inbox</span>
              </div>
              <span className={`font-mono text-[10px] text-[#6B6B6B] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden whitespace-nowrap ${
                isEffectiveExpanded ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
              }`}>{counts.inbox}</span>
            </button>
          </div>

          {/* Dedicated Pinned Categories Sub-Menu */}
          {pinnedCategories.length > 0 && (
            <div className="mt-5 pt-3.5 border-t border-[#262626]">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className={`font-mono text-[9px] text-[#6B6B6B] tracking-wider block transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
                  isEffectiveExpanded ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
                }`}>
                  PINNED CATEGORIES
                </span>
                <div className="w-10 flex items-center justify-center shrink-0">
                  <Pin className="h-3 w-3 text-[#6B6B6B]" />
                </div>
              </div>

              <div className="space-y-1">
                {pinnedCategories.map((cat) => {
                  const count = reels.filter(r => r.category_id === cat.id).length;
                  const catIcon = categoryMetaMap[cat.id]?.icon || 'Folder';
                  const theme = getCategoryTheme(catIcon, categoryMetaMap[cat.id]?.color);
                  const isSelected = currentPage === 'categories' && selectedCategoryId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverCatId(cat.id);
                      }}
                      onDragLeave={() => setDragOverCatId(null)}
                      onDrop={(e) => {
                        handleDropOnCategory(cat.id, e);
                      }}
                      onClick={() => {
                        router.push('/categories');
                        setSelectedCategoryId(cat.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center ${!isEffectiveExpanded ? 'justify-center px-0' : 'justify-between px-2.5'} rounded-xl py-1.5 text-xs font-medium transition-all ${
                        dragOverCatId === cat.id
                          ? 'ring-2 ring-white border-white bg-[#262626] scale-105'
                          : isSelected
                            ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.06)]'
                            : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D9D9D9] border border-transparent'
                      }`}
                      title={cat.name}
                    >
                      <div className="flex items-center min-w-0">
                        <div className="w-10 h-6 flex items-center justify-center shrink-0">
                          {renderCategoryIcon(catIcon, `h-4 w-4 shrink-0 ${theme.text} ${isSelected ? 'scale-110 drop-shadow-[0_0_4px_currentColor]' : ''}`)}
                        </div>
                        <span className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
                          isEffectiveExpanded ? 'max-w-[110px] opacity-100 ml-2.5 truncate' : 'max-w-0 opacity-0 pointer-events-none'
                        }`}>{cat.name}</span>
                      </div>
                      <span className={`font-mono text-[10px] text-[#6B6B6B] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden whitespace-nowrap ${
                        isEffectiveExpanded ? 'max-w-[30px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
                      }`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Settings at Bottom of Sidebar */}
        <div className="border-t border-[#333333] pt-2.5 mt-3 space-y-1">
          <button
            onClick={() => {
              router.push('/settings');
              setMobileMenuOpen(false);
            }}
            className={`flex w-full items-center ${!isEffectiveExpanded ? 'justify-center px-0' : 'justify-start px-2.5 gap-3'} rounded-xl py-2 text-xs font-medium transition-all ${
              currentPage === 'settings'
                ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] animate-in fade-in duration-200'
                : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-[#D9D9D9] border border-transparent'
            }`}
            title="Settings & Retention"
          >
            <div className="w-10 h-7 flex items-center justify-center shrink-0">
              <SettingsIcon className={`h-5 w-5 transition-transform duration-200 ${currentPage === 'settings' ? 'text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-zinc-400'}`} />
            </div>
            <span className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap overflow-hidden ${
              isEffectiveExpanded ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
            }`}>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-[#333333] bg-[#0B0B0B]/95 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden p-1.5 rounded-lg border border-[#333333] bg-[#141414] text-zinc-300 hover:text-white shrink-0 active:scale-95 transition"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Mobile Watch Later Brand Header */}
            <div className="flex md:hidden items-center gap-2 min-w-0">
              <img
                src="/logo.png"
                alt="Watch Later"
                className="h-6 w-6 object-contain shrink-0 drop-shadow"
              />
              <span className="font-oughter text-sm font-bold tracking-tight text-white truncate leading-none">
                Watch Later
              </span>
            </div>

            {/* Page title (Desktop only when sidebar collapsed, or secondary title) */}
            <div
              className={`hidden md:block overflow-hidden transition-all duration-300 ease-in-out shrink min-w-0 ${isEffectiveExpanded
                  ? 'max-w-0 opacity-0 pointer-events-none -translate-x-3'
                  : 'max-w-[180px] sm:max-w-xs opacity-100 translate-x-0 mr-1 sm:mr-2.5'
                }`}
            >
              <h2 className="font-sans text-xs sm:text-base font-bold text-white tracking-tight truncate">
                {currentPage === 'home' && 'Analytics & Intelligence'}
                {currentPage === 'all' && 'All Saved Content'}
                {currentPage === 'categories' && (selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || 'Category' : 'Categories Directory')}
                {(currentPage === 'savelater' || currentPage === 'saves') && 'Saves'}
                {currentPage === 'watched' && 'Watched Collection'}
                {currentPage === 'inbox' && 'Processing Inbox'}
                {currentPage === 'failed' && 'Extraction Issues'}
                {currentPage === 'archived' && 'Archived Content'}
                {currentPage === 'settings' && 'Settings'}
              </h2>
            </div>

            {/* Full-width Search Bar with Dynamic Animation */}
            {currentPage !== 'home' && currentPage !== 'settings' && !(currentPage === 'categories' && !selectedCategoryId) && (
              <div className="flex items-center gap-2.5 flex-1 w-full transition-all duration-300">
                <div className="relative flex-1">
                  <div className={`flex items-center gap-2.5 bg-[#1A1A1A] px-3.5 py-2 rounded-xl border transition-all duration-300 ease-out ${isSearchFocused ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.08)] bg-[#202020]' : 'border-[#333333] hover:border-[#444444]'
                    }`}>
                    <Search className={`h-4 w-4 shrink-0 transition-colors ${isSearchFocused ? 'text-white' : 'text-[#6B6B6B]'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Instant search by title, summary, or user..."
                      className="w-full bg-transparent text-xs sm:text-sm text-[#D9D9D9] placeholder-[#6B6B6B] focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-[#6B6B6B] hover:text-white p-1 rounded-md hover:bg-white/10 transition shrink-0 text-xs"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* View Layout Toggle Beside Search Bar */}
                <div className={`flex items-center bg-[#1A1A1A] p-0.5 rounded-xl border border-[#333333] transition-all duration-200 shrink-0 ${isSearchFocused ? 'opacity-0 pointer-events-none scale-90 w-0 p-0 overflow-hidden border-0' : 'opacity-100 scale-100'
                  }`}>
                  <button
                    onClick={() => updateViewLayout('grid')}
                    className={`p-1.5 rounded-lg transition ${viewLayout === 'grid' ? 'bg-[#333333] text-white' : 'text-[#6B6B6B] hover:text-white'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => updateViewLayout('list')}
                    className={`p-1.5 rounded-lg transition ${viewLayout === 'list' ? 'bg-[#333333] text-white' : 'text-[#6B6B6B] hover:text-white'}`}
                    title="List View"
                  >
                    <ListIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-10 animate-fade-up">
          {/* HOME VIEW: BENTO STATS & NICHE DISTRIBUTION */}
          {currentPage === 'home' && (
            <div className="space-y-4 sm:space-y-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="font-mono-micro text-[#D9D9D9] font-medium tracking-wider text-[9px] sm:text-[10px]">WATCHED</span>
                    <Film className="h-4 w-4 text-[#D9D9D9]" />
                  </div>
                  <div className="font-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    <NumberTicker value={counts.watched} />
                  </div>
                  <span className="font-mono-micro text-[#6B6B6B] mt-1 sm:mt-2 block text-[9px] sm:text-[10px]">
                    <NumberTicker value={reels.length} /> total saved ({reels.length > 0 ? Math.round((counts.watched / reels.length) * 100) : 0}%)
                  </span>
                </div>

                <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="font-mono-micro text-[#D9D9D9] font-medium tracking-wider text-[9px] sm:text-[10px]">CATEGORIES</span>
                    <FolderTree className="h-4 w-4 text-[#D9D9D9]" />
                  </div>
                  <div className="font-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    <NumberTicker value={categories.filter(c => !savesFolderIds.includes(c.id)).length} />
                  </div>
                  <span className="font-mono-micro text-[#6B6B6B] mt-1 sm:mt-2 block text-[9px] sm:text-[10px]">
                    <NumberTicker value={rootCategories.length} /> primary, <NumberTicker value={Math.max(0, categories.filter(c => !savesFolderIds.includes(c.id)).length - rootCategories.length)} /> sub-niches
                  </span>
                </div>

                <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-4 sm:p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="font-mono-micro text-[#D9D9D9] font-medium tracking-wider text-[9px] sm:text-[10px]">CONNECTED DEVICES</span>
                    <Smartphone className="h-4 w-4 text-[#D9D9D9]" />
                  </div>
                  <div className="font-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    <NumberTicker value={devices.length} />
                  </div>
                  <span className="font-mono-micro text-[#6B6B6B] mt-1 sm:mt-2 block text-[9px] sm:text-[10px]">
                    {devices.length > 0 ? (devices[0]?.device_name || 'Active Android / iOS') : 'No devices synced'}
                  </span>
                </div>
              </div>

              {/* Persona Insights */}
              {showPersonaInsights && (
                isFirstTimePersona ? (
                  <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-white/30 via-white/10 to-white/5 shadow-[0_0_25px_rgba(255,255,255,0.08)] overflow-hidden transition-all duration-500">
                    <div className="relative rounded-2xl bg-[#141414]/95 backdrop-blur-xl p-4 sm:p-7">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 sm:p-2 rounded-xl bg-white/10 border border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.12)]">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Vault Intelligence Persona</h3>
                              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold bg-white/10 text-zinc-200 border border-white/20">
                                ✨ Synthesized
                              </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-[#888888]">Your taste profile is primed and ready</span>
                          </div>
                        </div>

                        <button
                          onClick={dismissFirstTimePersona}
                          className="text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition active:scale-95"
                          title="Dismiss celebration and keep standard view"
                        >
                          Got it ✓
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans mb-3 font-medium">
                        {userPersonaInsight}
                      </p>

                      <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/15 bg-[#1A1A1A]/90 p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-[#D9D9D9]" />
                        <h3 className="font-sans text-xs sm:text-sm font-bold text-white tracking-tight">Vault Intelligence Persona</h3>
                      </div>
                      {reels.length < 20 && (
                        <span className="font-mono-micro text-[#6B6B6B] bg-[#0B0B0B] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-[#333333] text-[9px] sm:text-[10px]">
                          {reels.length} / 20 SAVED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#D9D9D9] leading-relaxed font-sans">
                      {userPersonaInsight}
                    </p>
                  </div>
                )
              )}

              {/* Compressed Niche Category Distribution */}
              <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-3.5 sm:p-5 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-sans text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-[#D9D9D9]" />
                    <span>Niche Category Breakdown</span>
                  </h3>
                </div>

                {(() => {
                  const nicheCategories = rootCategories.filter(
                    cat => !savesFolderIds.includes(cat.id) && cat.name.toLowerCase() !== 'saves' && cat.name.toLowerCase() !== 'save later'
                  );
                  const PIE_COLORS = ['#38BDF8', '#818CF8', '#A78BFA', '#F472B6', '#FB7185', '#FBBF24', '#34D399', '#2DD4BF', '#4ADE80', '#A3E635', '#F97316', '#E879F9'];

                  if (nicheViewMode === 'bars') {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
                        {nicheCategories.map((cat, idx) => {
                          const count = reels.filter(r => r.category_id === cat.id).length;
                          const pct = reels.length > 0 ? Math.round((count / reels.length) * 100) : 0;
                          return (
                            <div
                              key={cat.id}
                              className="group/bar flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-[#333333] bg-[#1A1A1A] hover:border-[#6B6B6B] hover:bg-[#1A1A1A]/90 transition-all duration-300 shadow-sm min-w-0"
                            >
                              <div className="flex items-center gap-1.5 sm:gap-2.5 w-24 sm:w-36 min-w-0 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-[#D9D9D9] transition-transform duration-300 group-hover/bar:scale-125" />
                                <span className="text-[11px] sm:text-xs font-medium text-[#D9D9D9] group-hover/bar:text-white truncate transition-colors">
                                  {cat.name}
                                </span>
                              </div>
                              <div className="flex-1 min-w-[50px] h-1.5 sm:h-2 rounded-full bg-[#0B0B0B] overflow-hidden border border-[#333333] p-px">
                                <div
                                  className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] bg-gradient-to-r from-[#6B6B6B] via-[#D9D9D9] to-[#FFFFFF]"
                                  style={{
                                    width: barsAnimated ? `${pct}%` : '0%',
                                    transitionDelay: `${Math.min(idx * 35, 450)}ms`
                                  }}
                                />
                              </div>
                              <span className="font-mono-micro text-[#6B6B6B] group-hover/bar:text-[#D9D9D9] w-16 sm:w-24 text-right tabular-nums text-[9px] sm:text-[10px] transition-colors shrink-0">
                                <NumberTicker value={count} duration={900} /> (<NumberTicker value={pct} duration={900} />%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Dynamic Pie View (Solid disc filled to core, larger & smooth entry)
                  const totalNicheReels = nicheCategories.reduce(
                    (acc, c) => acc + reels.filter(r => r.category_id === c.id).length, 0
                  );
                  const radius = 45;
                  const circumference = 2 * Math.PI * radius;
                  let accumulatedOffset = 0;

                  // Precalculate slice angles and callout pointer line coordinates
                  const sliceMetaList: {
                    cat: typeof nicheCategories[0];
                    count: number;
                    pct: number;
                    color: string;
                    midAngleRad: number;
                    sliceLength: number;
                    offset: number;
                  }[] = [];

                  if (totalNicheReels > 0) {
                    nicheCategories.forEach((cat, idx) => {
                      const count = reels.filter(r => r.category_id === cat.id).length;
                      if (count === 0) return;
                      const slicePercent = count / totalNicheReels;
                      const sliceLength = slicePercent * circumference;
                      const currentOffset = accumulatedOffset;
                      accumulatedOffset += sliceLength;
                      // In SVG stroke-dasharray rotated by -90deg (-PI/2), strokeDashoffset starts at top (angle -PI/2) and goes clockwise
                      const startAngle = (currentOffset / circumference) * 2 * Math.PI - Math.PI / 2;
                      const endAngle = ((currentOffset + sliceLength) / circumference) * 2 * Math.PI - Math.PI / 2;
                      const midAngleRad = (startAngle + endAngle) / 2;
                      sliceMetaList.push({
                        cat,
                        count,
                        pct: Math.round(slicePercent * 100),
                        color: PIE_COLORS[idx % PIE_COLORS.length],
                        midAngleRad,
                        sliceLength,
                        offset: currentOffset,
                      });
                    });
                  }

                  const activeHoveredSlice = hoveredPieCatId
                    ? sliceMetaList.find(s => s.cat.id === hoveredPieCatId)
                    : null;

                  return (
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 py-3 sm:py-4 px-1 sm:px-2 max-w-5xl mx-auto w-full">
                      {/* Enhanced Responsive Pie with Dynamic Pointer Callout */}
                      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 shrink-0 flex items-center justify-center max-w-full">
                        <svg viewBox="0 0 280 280" className="w-full h-full overflow-hidden sm:overflow-visible">
                          {/* Radial Slices (rotated inside group so pointer coordinates align) */}
                          <g className="-rotate-90 origin-[140px_140px] transform">
                            <circle
                              cx="140"
                              cy="140"
                              r={radius}
                              fill="#0E0E10"
                              stroke="#1A1A1E"
                              strokeWidth="90"
                            />
                            {totalNicheReels > 0 && sliceMetaList.map((slice) => {
                              const isHovered = hoveredPieCatId === slice.cat.id;

                              return (
                                <circle
                                  key={slice.cat.id}
                                  cx="140"
                                  cy="140"
                                  r={radius}
                                  fill="transparent"
                                  stroke={slice.color}
                                  strokeWidth={isHovered ? 94 : 90}
                                  strokeDasharray={pieAnimated ? `${slice.sliceLength} ${circumference}` : `0 ${circumference}`}
                                  strokeDashoffset={-slice.offset}
                                  className="transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
                                  style={{
                                    filter: isHovered ? `drop-shadow(0 0 14px ${slice.color})` : undefined,
                                  }}
                                  onMouseEnter={() => setHoveredPieCatId(slice.cat.id)}
                                  onMouseLeave={() => setHoveredPieCatId(null)}
                                />
                              );
                            })}
                          </g>

                          {/* Dynamic Minimalist Arrow / Line Indicator pointing directly to hovered segment */}
                          {activeHoveredSlice && (() => {
                            const cx = 140;
                            const cy = 140;
                            const sliceOuterR = 90;
                            const x1 = cx + (sliceOuterR - 4) * Math.cos(activeHoveredSlice.midAngleRad);
                            const y1 = cy + (sliceOuterR - 4) * Math.sin(activeHoveredSlice.midAngleRad);
                            const x2 = cx + (sliceOuterR + 18) * Math.cos(activeHoveredSlice.midAngleRad);
                            const y2 = cy + (sliceOuterR + 18) * Math.sin(activeHoveredSlice.midAngleRad);
                            const isRight = Math.cos(activeHoveredSlice.midAngleRad) >= 0;
                            const elbowLen = 18;
                            const x3 = isRight ? Math.min(x2 + elbowLen, 260) : Math.max(x2 - elbowLen, 20);
                            const y3 = y2;

                            // Label foreignObject positioned right at (x3, y3) with bounded placement
                            const labelWidth = 120;
                            const labelHeight = 32;
                            const foX = isRight ? Math.min(x3 + 4, 280 - labelWidth) : Math.max(x3 - labelWidth - 4, 0);
                            const foY = Math.max(4, Math.min(y3 - labelHeight / 2, 280 - labelHeight - 4));

                            return (
                              <g className="animate-in fade-in duration-200 pointer-events-none">
                                <circle cx={x1} cy={y1} r="3" fill={activeHoveredSlice.color} className="animate-ping" />
                                <circle cx={x1} cy={y1} r="2.5" fill={activeHoveredSlice.color} />
                                <polyline
                                  points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                                  fill="none"
                                  stroke={activeHoveredSlice.color}
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <foreignObject x={foX} y={foY} width={labelWidth} height={labelHeight}>
                                  <div className="flex items-center">
                                    <div className="rounded-xl px-2.5 py-1 bg-[#0A0A0C]/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.9)] flex items-center gap-1.5 whitespace-nowrap">
                                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: activeHoveredSlice.color }} />
                                      <span className="text-[11px] font-semibold text-white truncate max-w-[68px]">
                                        {activeHoveredSlice.cat.name}
                                      </span>
                                      <span className="text-[11px] font-mono font-bold text-white tabular-nums">
                                        {activeHoveredSlice.count}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
                                        ({activeHoveredSlice.pct}%)
                                      </span>
                                    </div>
                                  </div>
                                </foreignObject>
                              </g>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Interactive Legend Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 w-full max-h-56 overflow-y-auto pr-1">
                        {nicheCategories.map((cat, idx) => {
                          const count = reels.filter(r => r.category_id === cat.id).length;
                          const pct = totalNicheReels > 0 ? Math.round((count / totalNicheReels) * 100) : 0;
                          const color = PIE_COLORS[idx % PIE_COLORS.length];
                          const isHovered = hoveredPieCatId === cat.id;

                          return (
                            <div
                              key={cat.id}
                              onMouseEnter={() => setHoveredPieCatId(cat.id)}
                              onMouseLeave={() => setHoveredPieCatId(null)}
                              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition cursor-pointer min-w-0 ${
                                isHovered
                                  ? 'border-white/30 bg-white/10 text-white shadow-sm'
                                  : 'border-white/5 bg-[#0C0C0C]/80 hover:bg-[#141414] text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="truncate text-xs font-medium">{cat.name}</span>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-400 tabular-nums shrink-0">
                                {count} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* CATEGORIES DIRECTORY VIEW */}
          {currentPage === 'categories' && !selectedCategoryId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Categories Directory</h3>
                  <p className="text-[11px] sm:text-xs text-[#6B6B6B]">Click any category to open and explore saved posts directly.</p>
                </div>
                <button
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#D9D9D9] hover:bg-white text-[#0B0B0B] px-3 py-1.5 text-xs font-semibold active:scale-95 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              {isCreatingCategory && (
                <form onSubmit={handleCreateCategory} className="p-3.5 rounded-xl border border-[#333333] bg-[#1A1A1A]/95 flex flex-wrap gap-2 animate-fade-up">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name..."
                    className="flex-1 min-w-[180px] rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-1.5 text-xs text-white placeholder-[#6B6B6B] focus:border-[#D9D9D9] focus:outline-none"
                  />
                  <button type="submit" className="rounded-lg bg-[#D9D9D9] hover:bg-white text-[#0B0B0B] px-3.5 py-1.5 text-xs font-semibold">
                    Create Category
                  </button>
                </form>
              )}

              {/* Minimalist Category Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {rootCategories.map(cat => {
                  const count = reels.filter(r => r.category_id === cat.id).length;
                  const isPinned = pinnedFolderIds.includes(cat.id);
                  const isDragOver = dragOverCatId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={`group relative rounded-xl border transition shadow-sm overflow-hidden ${
                        isDragOver ? 'ring-2 ring-white border-white bg-[#262626] scale-105' : 'border-[#333333] bg-[#1A1A1A]/80 hover:bg-[#1A1A1A] hover:border-[#6B6B6B]'
                      }`}
                    >
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition z-20">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setEditCategoryName(cat.name);
                            setEditCategoryIcon(categoryMetaMap[cat.id]?.icon || 'Folder');
                            setEditCategoryColor(categoryMetaMap[cat.id]?.color || 'default');
                            setEditCategoryDesc(categoryMetaMap[cat.id]?.description || '');
                          }}
                          title="Edit name, icon & description"
                          className="p-1 rounded bg-[#0B0B0B]/80 hover:bg-[#333333] text-zinc-400 hover:text-white transition"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => togglePinFolder(cat.id)}
                          title={isPinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
                          className={`p-1 rounded bg-[#0B0B0B]/80 hover:bg-[#333333] transition ${isPinned ? 'text-amber-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                          {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={(e) => handleDeleteCategory(cat.id, e)}
                          title="Delete category"
                          className="p-1 rounded bg-[#0B0B0B]/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="w-full p-4 flex flex-col items-center justify-center text-center cursor-pointer"
                      >
                        <div className="relative mb-2.5">
                          {(() => {
                            const iconName = categoryMetaMap[cat.id]?.icon || 'Folder';
                            const theme = getCategoryTheme(iconName, categoryMetaMap[cat.id]?.color);
                            return (
                              <div className={`p-3 rounded-xl ${theme.bg} ${theme.border} border group-hover:scale-110 transition duration-200`}>
                                {renderCategoryIcon(iconName, `h-7 w-7 ${theme.text}`)}
                              </div>
                            );
                          })()}
                        </div>
                        <h4 className="font-semibold text-xs text-white group-hover:text-zinc-100 transition truncate max-w-full">
                          {cat.name}
                        </h4>
                        {categoryMetaMap[cat.id]?.description ? (
                          <p className="text-[10px] text-[#7E7E7E] mt-1 line-clamp-2 leading-relaxed max-w-full px-1">
                            {categoryMetaMap[cat.id]?.description?.slice(0, 80)}
                          </p>
                        ) : null}
                        <span className="font-mono text-[10px] text-[#888888] mt-1 tabular-nums block">
                          {count} post{count === 1 ? '' : 's'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DRILL-DOWN / REELS FEED VIEW */}
          {(currentPage !== 'home' && currentPage !== 'settings' && (currentPage !== 'categories' || selectedCategoryId)) && (
            <div>
              {/* Mobile Feed Page Heading Label (Identifies active feed view even when empty or search active) */}
              {!selectedCategoryId && (
                <div className="md:hidden mb-3">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    {currentPage === 'all' && 'All Saved Content'}
                    {currentPage === 'watched' && 'Watched Collection'}
                    {currentPage === 'inbox' && 'Processing Inbox'}
                    {currentPage === 'failed' && 'Extraction Issues'}
                    {currentPage === 'archived' && 'Archived Content'}
                    {(currentPage === 'savelater' || currentPage === 'saves') && 'Saves Vault'}
                  </h1>
                </div>
              )}

              {/* Category Breadcrumbs / Drill-Down Bar */}
              {selectedCategoryId && (
                <div className="mb-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      onDragOver={(e) => {
                        if (currentPage !== 'savelater' && currentPage !== 'saves' && currentPage !== 'categories') return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverCatId('__root__');
                      }}
                      onDragLeave={() => setDragOverCatId(null)}
                      onDrop={(e) => {
                        if (currentPage !== 'savelater' && currentPage !== 'saves' && currentPage !== 'categories') return;
                        handleDropOnCategory('__root__', e);
                      }}
                      className={`text-xs px-2 py-1 rounded-lg border transition ${
                        dragOverCatId === '__root__' ? 'border-amber-400 bg-amber-950/40 text-amber-200 ring-2 ring-amber-400' : 'border-transparent text-[#D9D9D9] hover:underline'
                      }`}
                    >
                      ← Back to {currentPage === 'savelater' || currentPage === 'saves' ? 'Saves' : 'Categories'} {(currentPage === 'savelater' || currentPage === 'saves' || currentPage === 'categories') && '(Drop to take out)'}
                    </button>
                    <span className="text-[#6B6B6B]">/</span>
                    <span className="text-xs text-white font-semibold">
                      {categories.find(c => c.id === selectedCategoryId)?.name}
                    </span>
                  </div>

                  {/* Subcategories inside this selected category (Categories page only) */}
                  {currentPage === 'categories' && (() => {
                    const subCats = categories.filter(c => c.parent_id === selectedCategoryId && !savesFolderIds.includes(c.id));
                    if (subCats.length === 0) return null;
                    const isDragAllowed = true;
                    return (
                      <div className="p-4 rounded-2xl border border-white/10 bg-[#141414]/90 backdrop-blur-md space-y-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                          Nested Categories ({subCats.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                          {subCats.map(sub => {
                            const subCount = reels.filter(r => r.category_id === sub.id || r.subcategory_id === sub.id).length;
                            const isOver = dragOverCatId === sub.id;
                            const subIcon = categoryMetaMap[sub.id]?.icon || 'Folder';
                            const subTheme = getCategoryTheme(subIcon, categoryMetaMap[sub.id]?.color);
                            return (
                              <div
                                key={sub.id}
                                draggable={isDragAllowed}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.target !== e.currentTarget) return;
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedCategoryId(sub.id);
                                  }
                                }}
                                onDragStart={(e) => {
                                  if (!isDragAllowed) { e.preventDefault(); return; }
                                  setDraggedItem({ type: 'folder', id: sub.id, folderId: sub.id });
                                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: sub.id, folderId: sub.id }));
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => setDraggedItem(null)}
                                onDragOver={(e) => {
                                  if (!isDragAllowed) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverCatId(sub.id);
                                }}
                                onDragLeave={() => setDragOverCatId(null)}
                                onDrop={(e) => {
                                  if (!isDragAllowed) return;
                                  handleDropOnCategory(sub.id, e);
                                }}
                                onClick={() => setSelectedCategoryId(sub.id)}
                                className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing select-none backdrop-blur-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                  isOver
                                    ? 'border-white bg-[#262626] ring-2 ring-white scale-105'
                                    : 'border-white/10 bg-[#141414]/85 hover:bg-[#1E1E1E]/95 hover:border-white/25 text-white shadow-lg'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className={`p-1.5 rounded-xl ${subTheme.bg} border ${subTheme.border} ${subTheme.text} group-hover:scale-105 transition-transform`}>
                                    {renderCategoryIcon(subIcon, "h-3.5 w-3.5")}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCategory(sub.id, e);
                                    }}
                                    className="opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition"
                                    title="Delete category"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-white group-hover:text-zinc-100 transition-colors block truncate">
                                    {sub.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">
                                    {subCount} {subCount === 1 ? 'post' : 'posts'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Nested Folders inside this selected Saves folder (Saves page only) */}
                  {(currentPage === 'savelater' || currentPage === 'saves') && (() => {
                    const nestedSaves = savesFolders.filter(f => f.parent_id === selectedCategoryId);
                    if (nestedSaves.length === 0) return null;
                    return (
                      <div className="p-4 rounded-2xl border border-white/10 bg-[#141414]/90 backdrop-blur-md space-y-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                          Nested Folders ({nestedSaves.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                          {nestedSaves.map(sub => {
                            const subCount = reels.filter(r => r.category_id === sub.id && savedLaterIds.includes(r.id)).length;
                            const isOver = dragOverCatId === sub.id;
                            return (
                              <div
                                key={sub.id}
                                draggable={true}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.target !== e.currentTarget) return;
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedCategoryId(sub.id);
                                  }
                                }}
                                onDragStart={(e) => {
                                  setDraggedItem({ type: 'folder', id: sub.id, folderId: sub.id });
                                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: sub.id, folderId: sub.id }));
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => setDraggedItem(null)}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverCatId(sub.id);
                                }}
                                onDragLeave={() => setDragOverCatId(null)}
                                onDrop={(e) => {
                                  handleDropOnCategory(sub.id, e);
                                }}
                                onClick={() => setSelectedCategoryId(sub.id)}
                                className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing select-none backdrop-blur-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                                  isOver
                                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-400 scale-105'
                                    : 'border-white/10 bg-[#141414]/85 hover:bg-[#1E1E1E]/95 hover:border-white/25 text-white shadow-lg'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="p-1.5 rounded-xl bg-white/10 border border-white/15 text-white group-hover:scale-105 transition-transform">
                                    <Folder className="h-3.5 w-3.5 text-cyan-400" />
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCategory(sub.id, e);
                                    }}
                                    className="opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition"
                                    title="Delete folder"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-white group-hover:text-cyan-200 transition-colors block truncate">
                                    {sub.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">
                                    {subCount} {subCount === 1 ? 'saved video' : 'saved videos'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Saves Page Folders & Folder Creation (separate from global AI categories) */}
              {(currentPage === 'savelater' || currentPage === 'saves') && !selectedCategoryId && (
                <div className="mb-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/10 bg-[#141414]/80 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white/10 text-white">
                        <Folder className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">Saves Folders</span>
                        <span className="text-[11px] text-[#7E7E7E] block">
                          {savesFolders.length === 0
                            ? 'Create custom folders in Saves or drag saved videos directly into them.'
                            : `${savesFolders.length} custom folder${savesFolders.length === 1 ? '' : 's'} in your Saves vault.`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsCreatingSaveFolder(!isCreatingSaveFolder)}
                      className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black px-3 py-1.5 text-xs font-semibold active:scale-95 transition shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Folder</span>
                    </button>
                  </div>

                  {isCreatingSaveFolder && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newSaveFolderName.trim()) return;
                        await handleCreateSaveFolder(newSaveFolderName.trim());
                        setNewSaveFolderName('');
                        setIsCreatingSaveFolder(false);
                      }}
                      className="p-3.5 rounded-2xl border border-white/15 bg-[#181818]/95 backdrop-blur-xl flex flex-wrap gap-2 animate-fade-up"
                    >
                      <input
                        type="text"
                        required
                        value={newSaveFolderName}
                        onChange={(e) => setNewSaveFolderName(e.target.value)}
                        placeholder="Folder name (e.g. Travel, Workouts, Music)..."
                        className="flex-1 min-w-[200px] rounded-xl border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={categoryInsertPending}
                        className="rounded-xl bg-white hover:bg-zinc-200 text-black px-3.5 py-1.5 text-xs font-semibold active:scale-95 transition disabled:opacity-50"
                      >
                        {categoryInsertPending ? 'Creating...' : 'Create Folder'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingSaveFolder(false)}
                        className="rounded-xl border border-white/10 text-zinc-400 hover:text-white px-3 py-1.5 text-xs transition"
                      >
                        Cancel
                      </button>
                    </form>
                  )}

                  {/* Render Saves Folders together with saved reels (Cut from root: only root folders without parent_id) */}
                  {savesFolders.filter(f => !f.parent_id).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 pt-2">
                      {savesFolders.filter(f => !f.parent_id).map((folder) => {
                        const count = reels.filter(r => r.category_id === folder.id && savedLaterIds.includes(r.id)).length;
                        const isDragOver = dragOverCatId === folder.id;

                        return (
                          <div
                            key={folder.id}
                            draggable={true}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedCategoryId(folder.id);
                              }
                            }}
                            onDragStart={(e) => {
                              setDraggedItem({ type: 'folder', id: folder.id, folderId: folder.id });
                              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id, folderId: folder.id }));
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => setDraggedItem(null)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverCatId(folder.id);
                            }}
                            onDragLeave={() => setDragOverCatId(null)}
                            onDrop={(e) => {
                              handleDropOnCategory(folder.id, e);
                            }}
                            onClick={() => setSelectedCategoryId(folder.id)}
                            className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing select-none backdrop-blur-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                              isDragOver
                                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-400 scale-105'
                                : 'border-white/10 bg-[#141414]/85 hover:bg-[#1E1E1E]/95 hover:border-white/25 text-white shadow-lg'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="p-1.5 rounded-xl bg-white/10 border border-white/15 text-white group-hover:scale-105 transition-transform">
                                <Folder className="h-3.5 w-3.5 text-cyan-400" />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(folder.id, e);
                                }}
                                className="opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition"
                                title="Delete folder"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-white group-hover:text-cyan-200 transition-colors block truncate">
                                {folder.name}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">
                                {count} {count === 1 ? 'saved video' : 'saved videos'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {displayedReels.length === 0 ? (
                <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#333333] text-center bg-[#1A1A1A]/40">
                  <Film className="h-10 w-10 text-[#6B6B6B] mb-2" />
                  <p className="text-xs font-medium text-[#D9D9D9]">No content found in this view</p>
                  <p className="mt-1 text-[11px] text-[#6B6B6B]">
                    Share a Reel from your phone to Watch Later to see it appear here.
                  </p>
                </div>
              ) : viewLayout === 'grid' ? (
                <div className={
                  density === 'extra-compact'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3.5 sm:gap-4'
                    : density === 'compact'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5'
                      : density === 'spacious'
                        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-9'
                        : density === 'extra-spacious'
                          ? 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10 sm:gap-12'
                          : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-7'
                }>
                  {renderedReels.map((reel) => {
                    const extractionErr = Array.isArray(reel.extracted_content)
                      ? reel.extracted_content[0]?.extraction_error
                      : reel.extracted_content?.extraction_error;
                    const isPending = reel.processing_status === 'pending' || reel.processing_status === 'resolving';
                    const isThisRetrying = retryingId === reel.id || isPending;
                    const isDragAllowed = currentPage === 'savelater' || currentPage === 'saves' || currentPage === 'categories';
                    const isSaved = savedLaterIds.includes(reel.id);

                    return (
                      <VirtualCardContainer
                        key={`${reel.id}-${searchQuery ? 's' : 'i'}`}
                        isForceMounted={activeCardMenuId === reel.id || detailReelId === reel.id}
                        className={`w-full ${
                          density === 'extra-compact'
                            ? 'min-h-[320px] aspect-[9/16]'
                            : density === 'compact'
                              ? 'min-h-[380px] aspect-[9/16]'
                              : density === 'spacious'
                                ? 'min-h-[500px] aspect-[9/15]'
                                : density === 'extra-spacious'
                                  ? 'min-h-[580px] aspect-[9/14]'
                                  : 'min-h-[430px] sm:min-h-[450px] aspect-[9/15]'
                        }`}
                      >
                        <div
                          draggable={isDragAllowed}
                        onDragStart={(e) => {
                          if (!isDragAllowed) return;
                          setDraggedItem({ type: 'reel', id: reel.id, reelId: reel.id });
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'reel', id: reel.id, reelId: reel.id }));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => setDraggedItem(null)}
                        onClick={() => {
                          if (reel.completion_status !== 'completed') {
                            handleStatusChange(reel.id, 'completed');
                          }
                          window.open(reel.url, '_blank', 'noopener,noreferrer');
                        }}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border ${
                          isSaved
                            ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.12),inset_0_0_12px_rgba(16,185,129,0.06)]'
                            : 'border-[#333333] hover:border-white/40 shadow-md'
                        } bg-[#141414] transform-gpu will-change-transform ${
                          isDragAllowed ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        } transition-all duration-500 ${
                          density === 'extra-compact'
                            ? 'min-h-[320px] aspect-[9/16] p-2.5'
                            : density === 'compact'
                              ? 'min-h-[380px] aspect-[9/16] p-3'
                              : density === 'spacious'
                                ? 'min-h-[500px] aspect-[9/15] p-4'
                                : density === 'extra-spacious'
                                  ? 'min-h-[580px] aspect-[9/14] p-5'
                                  : 'min-h-[430px] sm:min-h-[450px] aspect-[9/15] p-3.5'
                        } ${activeCardMenuId === reel.id ? 'z-20' : ''} ${searchQuery ? 'animate-in fade-in zoom-in-95 duration-150' : ''}`}
                      >
                        {/* Media Cover Layer */}
                        {showThumbnails && reel.thumbnail_url && (
                          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                            <img
                              src={reel.thumbnail_url}
                              alt="Reel Cover"
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15 group-hover:from-black/75 group-hover:via-black/25 group-hover:to-transparent transition-all duration-500 ease-out" />
                          </div>
                        )}

                        {/* Card Top: Controls & Status */}
                        <div className="relative z-10 flex items-center justify-between gap-1.5 w-full mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Saved Micro Checkmark Pill */}
                            {isSaved && (
                              <div
                                title="Saved"
                                className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-950/80 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-in zoom-in-75 fade-in duration-300"
                              >
                                <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />
                              </div>
                            )}

                            {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-medium backdrop-blur-md shadow-sm bg-red-500/20 text-red-300 border border-red-500/30">
                                Failed
                              </span>
                            )}
                            {isPending && (
                              <div className="flex items-center text-white" title="Extracting Content...">
                                <Morph size={20} />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                              <button
                                onClick={() => handleRetryExtraction(reel.id)}
                                disabled={isThisRetrying}
                                className="p-1 rounded-lg border border-red-500/30 bg-red-950/40 hover:bg-red-900/60 text-red-300 transition"
                                title="Retry Extraction"
                              >
                                <RotateCcw className={`h-3.5 w-3.5 ${isThisRetrying ? 'animate-spin text-white' : ''}`} />
                              </button>
                            )}

                            {/* 3-Dot Options Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenuId(activeCardMenuId === reel.id ? null : reel.id);
                                }}
                                className={`p-1.5 rounded-xl text-zinc-400 hover:text-white transition-colors duration-200 ${
                                  activeCardMenuId === reel.id
                                    ? 'opacity-100 bg-white/15'
                                    : 'opacity-80 hover:opacity-100 hover:bg-white/15'
                                }`}
                                title="Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {activeCardMenuId === reel.id && (
                                <div
                                  className="absolute right-full top-0 mr-2.5 w-48 rounded-2xl border border-white/20 bg-[#0C0C0E]/98 backdrop-blur-2xl p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.25)] z-50 animate-in fade-in zoom-in-95 duration-150 text-left select-none text-white"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl" />

                                  <button
                                    onClick={() => {
                                      setDetailReelId(reel.id);
                                      setActiveCardMenuId(null);
                                    }}
                                    className="relative z-10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-white hover:bg-white/15 transition active:scale-98"
                                  >
                                    <Info className="h-3.5 w-3.5 text-cyan-300" />
                                    <span>Inspect Details</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      handleStatusChange(reel.id, reel.completion_status === 'completed' ? 'pending' : 'completed');
                                      setActiveCardMenuId(null);
                                    }}
                                    className="relative z-10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-white hover:bg-white/15 transition active:scale-98"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>{reel.completion_status === 'completed' ? 'Mark Unwatched' : 'Mark Watched'}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      toggleSaveReel(reel.id);
                                      setActiveCardMenuId(null);
                                    }}
                                    className="relative z-10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-white hover:bg-white/15 transition active:scale-98"
                                  >
                                    <Bookmark className={`h-3.5 w-3.5 ${savedLaterIds.includes(reel.id) ? 'text-amber-400' : 'text-zinc-400'}`} />
                                    <span>{savedLaterIds.includes(reel.id) ? 'Remove from Saves' : 'Save to Saves'}</span>
                                  </button>

                                  <div className="relative z-10 my-1 border-t border-white/15" />

                                  <button
                                    onClick={(e) => {
                                      setActiveCardMenuId(null);
                                      handleDeleteReel(reel.id, e);
                                    }}
                                    className="relative z-10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-red-400 hover:bg-red-950/50 hover:text-red-300 transition active:scale-98"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete Post</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom: Content info */}
                        <div className="relative z-10 w-full mt-auto pt-3 transition-transform duration-500 ease-out transform group-hover:translate-y-16">
                          <h3 className="font-sans font-bold leading-snug text-sm sm:text-base mb-1 line-clamp-2 group-hover:line-clamp-1 drop-shadow-sm transition-all text-white group-hover:text-zinc-100">
                            {reel.ai_title || 'Instagram Post'}
                          </h3>
                          <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none">
                            {reel.ai_summary || reel.ai_description || reel.caption || 'No summary available'}
                          </p>

                          {(reel.is_failed || reel.processing_status === 'extraction_failed') && extractionErr && (
                            <div className="mt-2 rounded-lg bg-red-950/80 backdrop-blur-md p-1.5 text-[10px] text-red-200 border border-red-900/60">
                              <span className="font-mono break-all line-clamp-1">{extractionErr}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </VirtualCardContainer>
                  );
                })}
                  <div ref={sentinelRef} className="col-span-full h-8 w-full flex items-center justify-center py-2">
                    {visibleCount < displayedReels.length && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <Morph size={16} />
                        <span>Loading more reels...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Dedicated List View */
                <div className="space-y-3.5">
                  {renderedReels.map((reel) => {
                    const extractionErr = Array.isArray(reel.extracted_content)
                      ? reel.extracted_content[0]?.extraction_error
                      : reel.extracted_content?.extraction_error;
                    const isPending = reel.processing_status === 'pending' || reel.processing_status === 'resolving';
                    const isThisRetrying = retryingId === reel.id || isPending;

                    const catObj = categories.find(c => c.id === reel.category_id);
                    const subObj = categories.find(c => c.id === reel.subcategory_id);

                    const isDragAllowed = currentPage === 'savelater' || currentPage === 'saves' || currentPage === 'categories';
                    const isSaved = savedLaterIds.includes(reel.id);

                    return (
                      <VirtualCardContainer
                        key={`${reel.id}-${searchQuery ? 's' : 'i'}`}
                        minHeight={
                          density === 'extra-compact'
                            ? '48px'
                            : density === 'compact'
                              ? '56px'
                              : density === 'spacious'
                                ? '76px'
                                : density === 'extra-spacious'
                                  ? '88px'
                                  : '64px'
                        }
                        isForceMounted={activeCardMenuId === reel.id || detailReelId === reel.id}
                        className="w-full"
                        placeholderClassName="rounded-xl"
                      >
                        <div
                          draggable={isDragAllowed}
                        onDragStart={(e) => {
                          if (!isDragAllowed) return;
                          setDraggedItem({ type: 'reel', id: reel.id, reelId: reel.id });
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'reel', id: reel.id, reelId: reel.id }));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => setDraggedItem(null)}
                        onClick={() => {
                          if (reel.completion_status !== 'completed') {
                            handleStatusChange(reel.id, 'completed');
                          }
                          window.open(reel.url, '_blank', 'noopener,noreferrer');
                        }}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border ${
                          isSaved
                            ? 'border-emerald-500/50 shadow-[0_0_18px_rgba(16,185,129,0.12),inset_0_0_10px_rgba(16,185,129,0.05)]'
                            : 'border-[#333333] hover:border-[#6B6B6B] shadow-sm'
                        } bg-[#1A1A1A]/90 transform-gpu will-change-transform ${
                          density === 'extra-compact'
                            ? 'p-2 sm:py-1.5 sm:px-2.5'
                            : density === 'compact'
                              ? 'p-2.5 sm:py-2 sm:px-3'
                              : density === 'spacious'
                                ? 'p-4'
                                : density === 'extra-spacious'
                                  ? 'p-5'
                                  : 'p-3'
                          } backdrop-blur ${isDragAllowed ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${activeCardMenuId === reel.id ? 'relative z-20' : ''} ${searchQuery ? 'animate-in fade-in zoom-in-95 duration-150' : ''} transition`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1 w-full sm:w-auto">
                          {isPending ? (
                            <div className="relative h-16 w-16 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-[#0B0B0B] border border-[#333333] flex items-center justify-center text-white">
                              <Morph size={32} />
                            </div>
                          ) : showThumbnails && reel.thumbnail_url ? (
                            <div className="relative h-16 w-16 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-[#0B0B0B] border border-[#333333] group/thumb">
                              <img
                                src={reel.thumbnail_url}
                                alt="Thumbnail"
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover group-hover/thumb:scale-105 group-hover/thumb:brightness-110 transition"
                              />
                            </div>
                          ) : null}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {isSaved && (
                                <div
                                  title="Saved"
                                  className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-950/80 border border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.35)] animate-in zoom-in-75 fade-in duration-300"
                                >
                                  <Check className="h-2.5 w-2.5 text-emerald-400 stroke-[3]" />
                                </div>
                              )}
                              {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                                <span className="rounded px-1.5 py-0.5 font-mono-micro bg-red-950/60 text-red-400 border border-red-800/50">
                                  Failed
                                </span>
                              )}

                              {catObj && (
                                <span className="rounded bg-[#0B0B0B] px-1.5 py-0.5 font-mono-micro text-[#D9D9D9] border border-[#333333] truncate">
                                  {catObj.name}{subObj ? ` / ${subObj.name}` : ''}
                                </span>
                              )}
                            </div>

                            <h3 className="font-sans font-semibold leading-tight text-xs sm:text-sm truncate text-white">
                              {reel.ai_title || 'Instagram Post'}
                            </h3>

                            <p className="text-[11px] text-[#6B6B6B] truncate mt-0.5">
                              {reel.ai_summary || reel.ai_description || reel.caption || 'No summary available'}
                            </p>
                          </div>
                        </div>

                        {/* List Row Right Controls */}
                        <div
                          className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#333333] relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-mono-micro text-[#6B6B6B]">
                            {new Date(reel.created_at).toLocaleDateString()}
                          </span>

                          {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                            <button
                              onClick={() => handleRetryExtraction(reel.id)}
                              disabled={isThisRetrying}
                              className="flex items-center gap-1 rounded-lg border border-[#333333] bg-[#0B0B0B] hover:bg-[#333333] px-2.5 py-1 text-xs text-[#D9D9D9]"
                            >
                              <RotateCcw className={`h-3 w-3 ${isThisRetrying ? 'animate-spin text-white' : ''}`} />
                              <span>Retry</span>
                            </button>
                          )}

                          {/* 3-Dot Options Dropdown */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCardMenuId(activeCardMenuId === reel.id ? null : reel.id);
                              }}
                              className="p-1 rounded-lg hover:bg-[#333333] text-[#6B6B6B] hover:text-white transition"
                              title="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {activeCardMenuId === reel.id && (
                              <div
                                className="absolute right-full top-0 mr-2 w-48 rounded-2xl border border-white/20 bg-[#0C0C0E]/98 backdrop-blur-2xl p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.25)] z-50 animate-in fade-in zoom-in-95 duration-150 text-left select-none text-white"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl" />

                                <button
                                  onClick={() => {
                                    setDetailReelId(reel.id);
                                    setActiveCardMenuId(null);
                                  }}
                                  className="relative z-10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-white hover:bg-white/15 transition active:scale-98"
                                >
                                  <Info className="h-3.5 w-3.5 text-cyan-300" />
                                  <span>Inspect Details</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleStatusChange(reel.id, reel.completion_status === 'completed' ? 'pending' : 'completed');
                                    setActiveCardMenuId(null);
                                  }}
                                  className="relative z-10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-white hover:bg-white/15 transition active:scale-98"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>{reel.completion_status === 'completed' ? 'Mark Unwatched' : 'Mark Watched'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    toggleSaveReel(reel.id);
                                    setActiveCardMenuId(null);
                                  }}
                                  className="relative z-10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-white hover:bg-white/15 transition active:scale-98"
                                >
                                  <Bookmark className={`h-3.5 w-3.5 ${savedLaterIds.includes(reel.id) ? 'text-amber-400' : 'text-zinc-400'}`} />
                                  <span>{savedLaterIds.includes(reel.id) ? 'Remove from Saves' : 'Save to Saves'}</span>
                                </button>

                                <div className="relative z-10 my-1 border-t border-white/15" />

                                <button
                                  onClick={(e) => {
                                    setActiveCardMenuId(null);
                                    handleDeleteReel(reel.id, e);
                                  }}
                                  className="relative z-10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-red-400 hover:bg-red-950/50 hover:text-red-300 transition active:scale-98"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete Post</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </VirtualCardContainer>
                  );
                })}
                  <div ref={sentinelRef} className="h-8 w-full flex items-center justify-center py-2">
                    {visibleCount < displayedReels.length && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <Morph size={16} />
                        <span>Loading more reels...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS VIEW: MINIMAL, ELEGANT HORIZONTAL ROWS */}
          {currentPage === 'settings' && (
            <div className="w-full space-y-8 pb-16 animate-fade-up">
              {/* Page Title & Intro */}
              <div className="border-b border-[#222222] pb-4">
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-white tracking-tight">Settings</h2>
                <p className="text-xs text-[#7E7E7E] mt-1">Configure your account, visual preferences, queue policies, and synchronization nodes.</p>
              </div>

              {/* Section 1: Account Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <User className="h-4 w-4 text-white" />
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Account Settings</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Email Address</span>
                      <span className="text-[11px] text-[#737373]">Primary account address for authentication and sync</span>
                    </div>
                    <span className="font-mono text-xs text-[#D9D9D9] bg-[#141414] border border-[#262626] px-3 py-1.5 rounded-lg select-all">
                      {session?.user?.email || 'No email attached'}
                    </span>
                  </div>

                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Change Password</span>
                      <span className="text-[11px] text-[#737373]">Set a new password (min 6 characters)</span>
                    </div>
                    <form onSubmit={handleChangePassword} className="flex items-center gap-2 w-full sm:max-w-md">
                      <div className="relative flex-1">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="New password..."
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-[#2E2E2E] bg-[#121212] px-3 py-1.5 pr-8 text-xs text-white placeholder-[#555] focus:border-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-2 text-[#666] hover:text-white"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg bg-white hover:bg-zinc-200 text-[#0B0B0B] px-3.5 py-1.5 text-xs font-semibold shrink-0 transition active:scale-95"
                      >
                        Update
                      </button>
                    </form>
                  </div>
                  {passwordMsg && (
                    <div className="py-1 text-right">
                      <span className="text-[11px] text-[#D9D9D9] font-mono">{passwordMsg}</span>
                    </div>
                  )}

                  <div className="py-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-white block">Account Created At</span>
                      <span className="text-[11px] text-[#737373]">Vault registration timestamp</span>
                    </div>
                    <span className="font-mono text-xs text-[#7E7E7E]">
                      {session?.user?.created_at ? new Date(session.user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Appearance & Layout */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Palette className="h-4 w-4 text-white" />
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Appearance &amp; Layout</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Card Density</span>
                      <span className="text-[11px] text-[#737373]">Adjust grid column count and card sizing</span>
                    </div>
                    <select
                      value={density}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setDensity(val);
                        localStorage.setItem('watchlater_density', val);
                      }}
                      className="bg-[#121212] border border-[#2E2E2E] text-xs rounded-lg px-3 py-1.5 text-[#D9D9D9] focus:outline-none focus:border-white"
                    >
                      <option value="extra-compact">Extra Compact (Ultra dense / Maximum posts)</option>
                      <option value="compact">Compact (Dense / High volume)</option>
                      <option value="comfortable">Comfortable (Balanced)</option>
                      <option value="spacious">Spacious (Large cards)</option>
                      <option value="extra-spacious">Extra Spacious (Cinematic / Full size)</option>
                    </select>
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <label htmlFor="niche-breakdown-mode" className="text-xs font-medium text-white block cursor-pointer">Niche Breakdown Format</label>
                      <span className="text-[11px] text-[#737373]">Choose between linear distribution bars and dynamic pie chart</span>
                    </div>
                    <select
                      id="niche-breakdown-mode"
                      value={nicheViewMode}
                      onChange={(e) => updateNicheViewMode(e.target.value as 'bars' | 'pie')}
                      className="rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-1.5 text-xs text-white focus:border-white focus:outline-none cursor-pointer"
                    >
                      <option value="bars">Bar Distribution</option>
                      <option value="pie">Interactive Pie Chart</option>
                    </select>
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Display Thumbnails</span>
                      <span className="text-[11px] text-[#737373]">Show cover pictures and visual media on cards</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showThumbnails}
                      onChange={(e) => {
                        setShowThumbnails(e.target.checked);
                        localStorage.setItem('watchlater_show_thumbnails', String(e.target.checked));
                      }}
                      className="rounded accent-white cursor-pointer h-4 w-4"
                    />
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <label htmlFor="show-persona-insights" className="text-xs font-medium text-white block cursor-pointer">Show Persona Insights</label>
                      <span className="text-[11px] text-[#737373]">Display &quot;Vault Intelligence Persona&quot; panel on Home</span>
                    </div>
                    <input
                      id="show-persona-insights"
                      type="checkbox"
                      checked={showPersonaInsights}
                      onChange={(e) => {
                        setShowPersonaInsights(e.target.checked);
                        localStorage.setItem('watchlater_show_persona', String(e.target.checked));
                      }}
                      className="rounded accent-white cursor-pointer h-4 w-4"
                    />
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Sidebar Collapsed by Default</span>
                      <span className="text-[11px] text-[#737373]">Keep navigation sidebar minimized on wider screens</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={sidebarCollapsed}
                      onChange={(e) => {
                        setSidebarCollapsed(e.target.checked);
                        localStorage.setItem('watchlater_sidebar_collapsed', String(e.target.checked));
                      }}
                      className="rounded accent-white cursor-pointer h-4 w-4"
                    />
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Welcome &amp; Feature Walkthrough</span>
                      <span className="text-[11px] text-[#737373]">Replay the interactive feature tour anytime</span>
                    </div>
                    <button
                      onClick={() => setShowGameGuide(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white transition active:scale-95 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
                      <span>Replay Tour</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Archive Auto-Delete & Retention */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Clock className="h-4 w-4 text-white" />
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Archive Auto-Delete &amp; Retention</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Auto-Purge Window</span>
                      <span className="text-[11px] text-[#737373]">Archived posts are permanently purged after this retention window (cap is 1 month)</span>
                    </div>
                    <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-[#2E2E2E]">
                      <button
                        onClick={() => {
                          setRetentionPeriod('day');
                          localStorage.setItem('watchlater_archive_retention', 'day');
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          retentionPeriod === 'day' ? 'bg-white text-[#0B0B0B]' : 'text-[#737373] hover:text-white'
                        }`}
                      >
                        1 Day
                      </button>
                      <button
                        onClick={() => {
                          setRetentionPeriod('week');
                          localStorage.setItem('watchlater_archive_retention', 'week');
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          retentionPeriod === 'week' ? 'bg-white text-[#0B0B0B]' : 'text-[#737373] hover:text-white'
                        }`}
                      >
                        1 Week
                      </button>
                      <button
                        onClick={() => {
                          setRetentionPeriod('month');
                          localStorage.setItem('watchlater_archive_retention', 'month');
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          retentionPeriod === 'month' ? 'bg-white text-[#0B0B0B]' : 'text-[#737373] hover:text-white'
                        }`}
                      >
                        1 Month (Cap)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Vault Status Queues */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Archive className="h-4 w-4 text-white" />
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Vault Status Queues</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Status Queues</span>
                      <span className="text-[11px] text-[#737373]">Inspect extraction issues or view posts pending retention purge</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative group">
                        <button
                          onClick={() => { router.push('/failed'); setSelectedCategoryId(null); }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2E2E2E] bg-[#121212] hover:bg-[#1A1A1A] hover:border-[#555555] text-xs font-medium text-white transition active:scale-95"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Failed Items</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-bold border border-white/10">
                            {counts.failed}
                          </span>
                        </button>
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 animate-in fade-in zoom-in-95 duration-150">
                          <div className="rounded-md border border-[#3E3E3E] bg-[#1A1A1A] px-2.5 py-1 text-[11px] text-zinc-200 shadow-xl whitespace-nowrap">
                            {counts.failed} extraction error{counts.failed === 1 ? '' : 's'} · Click to view &amp; resolve
                          </div>
                          <div className="h-1 w-2 border-x-4 border-t-4 border-x-transparent border-t-[#1A1A1A]" />
                        </div>
                      </div>

                      <div className="relative group">
                        <button
                          onClick={() => { router.push('/archived'); setSelectedCategoryId(null); }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2E2E2E] bg-[#121212] hover:bg-[#1A1A1A] hover:border-[#555555] text-xs font-medium text-white transition active:scale-95"
                        >
                          <Archive className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Archived Items</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-bold border border-white/10">
                            {counts.archived}
                          </span>
                        </button>
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 animate-in fade-in zoom-in-95 duration-150">
                          <div className="rounded-md border border-[#3E3E3E] bg-[#1A1A1A] px-2.5 py-1 text-[11px] text-zinc-200 shadow-xl whitespace-nowrap">
                            {counts.archived} post{counts.archived === 1 ? '' : 's'} in auto-purge retention queue
                          </div>
                          <div className="h-1 w-2 border-x-4 border-t-4 border-x-transparent border-t-[#1A1A1A]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Data Management & Export */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Download className="h-4 w-4 text-white" />
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Data Management &amp; Export</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Curated Library Operations</span>
                      <span className="text-[11px] text-[#737373]">Export your saved reels or clean completed and stored items</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => exportData()}
                        className="flex items-center gap-1.5 rounded-lg border border-[#2E2E2E] bg-[#121212] hover:bg-[#1E1E1E] hover:border-[#555] px-3 py-1.5 text-xs font-medium text-white transition active:scale-95"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV ({reels.length})</span>
                      </button>
                      <button
                        onClick={async () => {
                          const completedReels = reels.filter(r => r.completion_status === 'completed');
                          if (completedReels.length === 0) {
                            alert('No watched items to delete.');
                            return;
                          }
                          if (!confirm(`Permanently delete ${completedReels.length} watched item(s)?`)) return;
                          const ids = completedReels.map(r => r.id);
                          setReels(prev => prev.filter(r => r.completion_status !== 'completed'));
                          const { error } = await supabase.from('reels').delete().in('id', ids);
                          if (error) {
                            alert(`Failed: ${error.message}`);
                            await loadData();
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-[#2E2E2E] bg-[#121212] hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-300 text-zinc-300 px-3 py-1.5 text-xs font-medium transition active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Watched</span>
                      </button>
                      <button
                        onClick={() => {
                          setClearCategoriesAlso(false);
                          setShowClearHistoryLightbox(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-[#2E2E2E] bg-[#121212] hover:bg-red-950/40 hover:border-red-800/60 text-red-400 px-3 py-1.5 text-xs font-medium transition active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete All Saved Items</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Registered Devices & Synchronization */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Smartphone className="h-4 w-4 text-white" />
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Registered Devices &amp; Synchronization</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  {devices.length === 0 ? (
                    <div className="py-3.5 flex items-center justify-between">
                      <span className="text-xs text-[#737373]">No mobile devices registered yet</span>
                      <span className="font-mono text-[11px] text-[#555]">0 connected nodes</span>
                    </div>
                  ) : (
                    devices.map((dev) => {
                      const isApple = dev.platform === 'ios' || dev.device_name?.toLowerCase().includes('iphone') || dev.device_name?.toLowerCase().includes('ipad');
                      return (
                        <div key={dev.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-[#141414] border border-[#2E2E2E] flex items-center justify-center text-white shrink-0">
                              <Smartphone className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white">{dev.device_name || (isApple ? 'Apple iPhone' : 'Android Device')}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[#2E2E2E] bg-[#141414] text-zinc-300">
                                  {isApple ? ' iOS' : '🤖 Android'}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#737373] font-mono">
                                Last synced: {new Date(dev.last_synced_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveDevice(dev.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-950/30 transition"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Section 7: Session & Sign Out */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <LogOut className="h-4 w-4 text-white" />
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white tracking-tight">Session &amp; Logout</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Active Browser Session</span>
                      <span className="text-[11px] text-[#737373]">Signed in as {session?.user?.email}</span>
                    </div>
                    <button
                      onClick={() => supabase.auth.signOut({ scope: 'local' })}
                      className="flex items-center gap-1.5 rounded-lg border border-[#2E2E2E] bg-[#121212] hover:bg-red-950/40 hover:border-red-900/60 hover:text-red-300 text-zinc-300 px-3.5 py-1.5 text-xs font-semibold transition active:scale-95"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* REEL DETAIL PANEL / LIGHTBOX (Apple Liquid Glass) */}
      {detailReel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/25 backdrop-blur-md animate-fade-in"
          onClick={() => setDetailReelId(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[32px] overflow-hidden border border-white/25 bg-gradient-to-b from-white/[0.12] via-[#141414]/95 to-[#0A0A0A]/98 backdrop-blur-3xl shadow-[0_32px_90px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.4)] text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-tr from-cyan-400/15 via-white/10 to-purple-500/15 pointer-events-none rounded-t-[32px] blur-2xl" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
              <div className="flex items-center gap-3 truncate">
                <div className="h-8 w-8 rounded-xl bg-white/[0.1] border border-white/20 flex items-center justify-center text-white shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  <Film className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-sans text-lg font-bold text-white truncate">
                  {detailReel.ai_title || 'Post Details'}
                </h3>
              </div>
              <button
                onClick={() => setDetailReelId(null)}
                className="p-1.5 rounded-full bg-white/[0.1] hover:bg-white/[0.2] border border-white/20 text-white/80 hover:text-white transition active:scale-90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left: Video ONLY */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border border-white/20 bg-black/60 shadow-2xl">
                    {detailReel.thumbnail_url ? (
                      <img
                        src={detailReel.thumbnail_url}
                        alt="Reel Media"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/40">
                        <Film className="h-12 w-12" />
                      </div>
                    )}
                    <a
                      href={detailReel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 group"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-bold shadow-xl transition-transform group-hover:scale-105">
                        <ExternalLink className="h-4 w-4" />
                        <span>Watch on Instagram</span>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Right: ALL Content & Information */}
                <div className="md:col-span-7 flex flex-col space-y-4">
                  {/* Category & Platform Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const cat = categories.find(c => c.id === detailReel.category_id);
                      const iconName = cat ? (categoryMetaMap[cat.id]?.icon || 'Folder') : 'Folder';
                      const theme = getCategoryTheme(iconName, cat ? categoryMetaMap[cat.id]?.color : undefined);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${theme.bg} ${theme.text} border ${theme.border}`}>
                          {renderCategoryIcon(iconName, "h-3.5 w-3.5")}
                          <span>{cat?.name || 'Uncategorized'}</span>
                        </span>
                      );
                    })()}
                    <span className="font-mono text-[11px] text-zinc-300 bg-white/10 border border-white/15 px-3 py-1 rounded-xl">
                      {detailReel.url.includes('tiktok') ? 'TikTok' : detailReel.url.includes('youtu') ? 'YouTube' : 'Instagram'}
                    </span>
                  </div>

                  {/* Metadata: Creator & Date */}
                  <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">Creator</span>
                      <span className="font-semibold text-white">@{detailReel.creator_username || 'unknown'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">Added On</span>
                      <span className="text-zinc-300 font-mono text-[11px]">
                        {new Date(detailReel.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* AI Synthesized Summary */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 block mb-1">
                      AI Synthesized Summary
                    </span>
                    <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed">
                      {detailReel.ai_summary || detailReel.ai_description || 'No summary extracted for this item.'}
                    </p>
                  </div>

                  {/* Original Caption */}
                  {detailReel.caption && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">
                        Original Caption
                      </span>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto pr-2">
                        {detailReel.caption}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 mt-auto">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(detailReel.id, detailReel.completion_status === 'completed' ? 'pending' : 'completed')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow-md ${
                          detailReel.completion_status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>{detailReel.completion_status === 'completed' ? 'Completed' : 'Mark Watched'}</span>
                      </button>

                      <button
                        onClick={() => toggleSaveReel(detailReel.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow-md ${
                          savedLaterIds.includes(detailReel.id)
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>{savedLaterIds.includes(detailReel.id) ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        handleDeleteReel(detailReel.id, e);
                        setDetailReelId(null);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 transition active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR HISTORY CONFIRMATION LIGHTBOX (Apple Liquid Glass) */}
      {showClearHistoryLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/25 backdrop-blur-md animate-fade-in"
          onClick={() => {
            if (!isClearingHistory) setShowClearHistoryLightbox(false);
          }}
        >
          <div
            className="relative w-full max-w-md rounded-[32px] overflow-hidden border border-red-500/30 bg-gradient-to-b from-white/[0.12] via-[#141414]/95 to-[#0A0A0A]/98 backdrop-blur-3xl p-6 sm:p-7 shadow-[0_32px_90px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.4)] text-white space-y-4 animate-in zoom-in-95 duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-tr from-red-500/20 via-transparent to-transparent pointer-events-none rounded-t-[32px] blur-xl" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-sans text-base font-bold text-white">Delete All Saved Items</h3>
                <p className="text-xs text-white/70">Permanently delete saved items from your account.</p>
              </div>
            </div>

            <p className="relative z-10 text-xs text-white/80 leading-relaxed">
              This will permanently remove all {reels.length} saved item(s) from Watch Later. This action cannot be undone.
            </p>

            <div className="relative z-10 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 flex items-start gap-3 backdrop-blur-md">
              <input
                id="clear-categories-check"
                type="checkbox"
                checked={clearCategoriesAlso}
                onChange={e => setClearCategoriesAlso(e.target.checked)}
                className="mt-0.5 rounded accent-red-500 cursor-pointer h-4 w-4 shrink-0"
              />
              <label htmlFor="clear-categories-check" className="text-xs text-white/90 cursor-pointer leading-tight">
                Also delete all custom categories ({categories.length} categories will be removed)
              </label>
            </div>

            <div className="relative z-10 flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isClearingHistory}
                onClick={() => setShowClearHistoryLightbox(false)}
                className="rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.16] px-4 py-2 text-xs font-semibold text-white transition active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingHistory}
                onClick={handleConfirmClearHistory}
                className="rounded-xl bg-red-600 hover:bg-red-500 text-white px-5 py-2 text-xs font-bold transition active:scale-95 shadow-[0_4px_20px_rgba(220,38,38,0.4)] disabled:opacity-50"
              >
                {isClearingHistory ? 'Deleting All...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY LIGHTBOX (Apple Liquid Glass) */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/25 backdrop-blur-md animate-fade-in"
          onClick={() => setEditingCategory(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-[32px] overflow-hidden border border-white/25 bg-gradient-to-b from-white/[0.12] via-[#141414]/95 to-[#0A0A0A]/98 backdrop-blur-3xl p-6 shadow-[0_32px_90px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.4)] text-white space-y-5 animate-in zoom-in-95 duration-200 select-none max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-tr from-cyan-400/15 via-white/10 to-purple-500/15 pointer-events-none rounded-t-[32px] blur-xl" />

            <div className="relative z-10 flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/[0.1] text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold text-white tracking-tight">Customize Category</h3>
                  <p className="text-[11px] text-white/70">Personalize name, color accent, and iconic symbol</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 rounded-full bg-white/[0.1] hover:bg-white/[0.2] border border-white/20 text-white/80 hover:text-white transition active:scale-90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#D9D9D9] block mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  value={editCategoryName}
                  onChange={e => setEditCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-[#333333] bg-[#0B0B0B] px-3.5 py-2 text-xs text-white placeholder-[#6B6B6B] focus:border-white focus:outline-none transition"
                  placeholder="e.g. Cooking, Tech, Workouts"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#D9D9D9]">Icon Accent Color</label>
                  <span className="text-[11px] font-mono text-[#888888]">
                    {COLOR_PRESETS.find(p => p.id === editCategoryColor)?.name || 'Original'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 p-2 rounded-xl border border-[#262626] bg-[#0B0B0B]">
                  {COLOR_PRESETS.map((p) => {
                    const isSelected = editCategoryColor === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEditCategoryColor(p.id)}
                        title={p.name}
                        className={`group relative flex items-center justify-center h-6 w-6 rounded-full border transition-all active:scale-95 ${
                          isSelected
                            ? 'border-white scale-125 shadow-[0_0_12px_rgba(255,255,255,0.35)]'
                            : 'border-[#333333] hover:border-[#6B6B6B]'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full transition-transform group-hover:scale-110"
                          style={{ backgroundColor: p.hex }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#D9D9D9] block mb-1.5">Icon Style</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                  {[
                    { icon: 'Folder', label: 'Folder' },
                    { icon: 'Star', label: 'Star' },
                    { icon: 'Sparkles', label: 'Sparkles' },
                    { icon: 'Bookmark', label: 'Bookmark' },
                    { icon: 'BookmarkCheck', label: 'Check' },
                    { icon: 'Compass', label: 'Compass' },
                    { icon: 'BookOpen', label: 'Book' },
                    { icon: 'Tag', label: 'Tag' },
                    { icon: 'Code', label: 'Code' },
                    { icon: 'Music', label: 'Music' },
                    { icon: 'Camera', label: 'Camera' },
                    { icon: 'Coffee', label: 'Coffee' },
                    { icon: 'Heart', label: 'Heart' },
                    { icon: 'Briefcase', label: 'Briefcase' },
                    { icon: 'Flame', label: 'Flame' },
                    { icon: 'Globe', label: 'Globe' },
                    { icon: 'Dumbbell', label: 'Fitness' },
                    { icon: 'Lightbulb', label: 'Idea' },
                    { icon: 'Cpu', label: 'Tech' },
                    { icon: 'GraduationCap', label: 'Learn' },
                    { icon: 'Film', label: 'Movie' },
                    { icon: 'Gamepad2', label: 'Gaming' },
                    { icon: 'Tv', label: 'TV' },
                    { icon: 'Headphones', label: 'Audio' },
                    { icon: 'Palette', label: 'Design' },
                    { icon: 'ShoppingBag', label: 'Shop' },
                    { icon: 'Car', label: 'Car' },
                    { icon: 'Plane', label: 'Travel' },
                    { icon: 'Utensils', label: 'Food' },
                    { icon: 'Trophy', label: 'Trophy' },
                    { icon: 'Zap', label: 'Energy' },
                    { icon: 'Video', label: 'Video' },
                    { icon: 'DollarSign', label: 'Finance' },
                    { icon: 'Mountain', label: 'Outdoors' },
                    { icon: 'Trees', label: 'Nature' },
                    { icon: 'Shield', label: 'Security' },
                    { icon: 'Smile', label: 'Fun' },
                    { icon: 'Newspaper', label: 'News' },
                    { icon: 'Rocket', label: 'Launch' },
                    { icon: 'Wrench', label: 'Tools' }
                  ].map((item) => {
                    const isSelected = editCategoryIcon === item.icon;
                    const previewTheme = getCategoryTheme(item.icon, editCategoryColor);
                    return (
                      <button
                        key={item.icon}
                        type="button"
                        onClick={() => setEditCategoryIcon(item.icon)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition active:scale-95 ${
                          isSelected
                            ? 'border-white bg-[#222222] shadow-sm'
                            : 'border-[#333333] bg-[#0B0B0B] hover:bg-[#1A1A1A]'
                        }`}
                      >
                        <div className="mb-1">
                          {renderCategoryIcon(item.icon, `h-4 w-4 ${previewTheme.text}`)}
                        </div>
                        <span className={`text-[10px] truncate max-w-full ${isSelected ? 'text-white font-semibold' : 'text-[#888888]'}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#D9D9D9] block mb-1.5">Description / Topic Identity</label>
                <textarea
                  rows={2}
                  value={editCategoryDesc}
                  onChange={e => setEditCategoryDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#333333] bg-[#0B0B0B] px-3.5 py-2 text-xs text-white placeholder-[#6B6B6B] focus:border-white focus:outline-none resize-none transition"
                  placeholder="What is saved in this category (e.g. Italian pasta recipes, quick dinners)?"
                />
                <span className="text-[10px] text-[#6B6B6B] block mt-1">
                  This description preserves the category&apos;s purpose so content continues organizing here cleanly.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.16] px-4 py-2 text-xs font-semibold text-white/90 transition active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-white hover:bg-zinc-200 text-black px-5 py-2 text-xs font-bold transition active:scale-95 shadow-[0_4px_16px_rgba(255,255,255,0.25)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Walkthrough Modal */}
      <GameOnboardingGuide
        isOpen={showGameGuide}
        onClose={() => setShowGameGuide(false)}
        onComplete={handleCompleteGameGuide}
      />
    </div>
  );
}
