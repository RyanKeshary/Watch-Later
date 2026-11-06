'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Reel, Category, Device } from '@/types/database';
import {
  Home,
  Film,
  FolderTree,
  Folder,
  Inbox,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Archive,
  Settings as SettingsIcon,
  RefreshCw,
  ExternalLink,
  Search,
  LogOut,
  Sparkles,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Pin,
  PinOff,
  Clock,
  Tag,
  User,
  Sliders,
  Palette,
  Download,
  Smartphone,
  Info,
  Calendar,
  X,
  Eye,
  Activity,
  Layers,
  PieChart,
  HardDrive
} from 'lucide-react';

type NavPage = 'home' | 'all' | 'categories' | 'watched' | 'inbox' | 'failed' | 'archived' | 'settings';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active navigation page
  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Data
  const [reels, setReels] = useState<Reel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Detailed Reel View Panel (derived from reel ID)
  const [detailReelId, setDetailReelId] = useState<string | null>(null);
  const detailReel = useMemo(() => {
    return detailReelId ? reels.find(r => r.id === detailReelId) || null : null;
  }, [detailReelId, reels]);

  // Category Lightbox Modal (Categories page: drill down 3 generations deeper)
  const [categoryLightbox, setCategoryLightbox] = useState<Category | null>(null);

  // Reconcile selectedCategoryId and categoryLightbox whenever categories change
  useEffect(() => {
    if (selectedCategoryId && !categories.some(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
    if (categoryLightbox && !categories.some(c => c.id === categoryLightbox.id)) {
      setCategoryLightbox(null);
    }
  }, [categories, selectedCategoryId, categoryLightbox]);

  // UI customization states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);

  // Settings: Preferences & Ingestion Rules
  const [maxGenerations, setMaxGenerations] = useState(3);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [autoProcess, setAutoProcess] = useState(true);
  const [detectDuplicates, setDetectDuplicates] = useState(true);
  const [keepFailedInLib, setKeepFailedInLib] = useState(true);
  const [autoRetryFailed, setAutoRetryFailed] = useState(true);
  const [showProcessingNotifications, setShowProcessingNotifications] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Category creation modal/inline
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Load local preferences
  useEffect(() => {
    try {
      const savedPins = localStorage.getItem('reelvault_pinned_folders');
      if (savedPins) setPinnedFolderIds(JSON.parse(savedPins));

      const savedMaxGen = localStorage.getItem('reelvault_max_generations');
      if (savedMaxGen) setMaxGenerations(parseInt(savedMaxGen, 10));

      const savedTheme = localStorage.getItem('reelvault_theme');
      if (savedTheme) setTheme(savedTheme as any);

      const savedDensity = localStorage.getItem('reelvault_density');
      if (savedDensity) setDensity(savedDensity as any);

      const savedLayout = localStorage.getItem('reelvault_view_layout');
      if (savedLayout) setViewLayout(savedLayout as any);

      const savedThumbs = localStorage.getItem('reelvault_show_thumbnails');
      if (savedThumbs !== null) setShowThumbnails(savedThumbs === 'true');

      const savedRetention = localStorage.getItem('reelvault_archive_retention') as any;
      if (savedRetention) setRetentionPeriod(savedRetention);
    } catch (e) {}
  }, []);

  const togglePin = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedFolderIds(prev => {
      const next = prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId];
      try {
        localStorage.setItem('reelvault_pinned_folders', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user?.id) {
        setRefreshing(false);
        return;
      }
      const requestUserId = currentSession.user.id;

      // Paginate through all reels
      const pageSize = 1000;
      let allReels: Reel[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: pageData, error: pageErr } = await supabase
          .from('reels')
          .select(`
            *,
            extracted_content (
              extraction_error,
              raw_scraper_output
            )
          `)
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (pageErr) {
          console.error('Error fetching reels page:', pageErr);
          break;
        }

        if (pageData && pageData.length > 0) {
          allReels = allReels.concat(pageData as Reel[]);
          if (pageData.length < pageSize) {
            hasMore = false;
          } else {
            from += pageSize;
          }
        } else {
          hasMore = false;
        }
      }

      const { data: catsData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      const { data: devsData } = await supabase
        .from('devices')
        .select('*')
        .order('last_synced_at', { ascending: false });

      const { data: { session: latestSession } } = await supabase.auth.getSession();
      if (latestSession?.user?.id === requestUserId) {
        setReels(allReels);
        if (catsData) setCategories(catsData as Category[]);
        if (devsData) setDevices(devsData as Device[]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession((prevSession: any) => {
        if (!newSession?.user) {
          setReels([]);
          setCategories([]);
          setDevices([]);
        } else if (prevSession?.user?.id && newSession?.user?.id !== prevSession.user.id) {
          setReels([]);
          setCategories([]);
          setDevices([]);
        }
        return newSession;
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (session) {
      loadData();

      const channel = supabase
        .channel('realtime_all_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reels' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newReel = payload.new as Reel;
              setReels((prev) => {
                if (prev.some(r => r.id === newReel.id)) return prev;
                return [newReel, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Reel;
              // If failed or updated, fetch extracted_content so extraction error updates in real time
              if (updated.is_failed || updated.processing_status === 'extraction_failed') {
                supabase
                  .from('extracted_content')
                  .select('extraction_error, raw_scraper_output')
                  .eq('reel_id', updated.id)
                  .maybeSingle()
                  .then(({ data }) => {
                    setReels((prev) => prev.map(r => r.id === updated.id ? { ...r, ...updated, extracted_content: data || r.extracted_content } : r));
                  });
              } else {
                setReels((prev) => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
              }
            } else if (payload.eventType === 'DELETE') {
              setReels((prev) => prev.filter(r => r.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newCat = payload.new as Category;
              setCategories((prev) => {
                if (prev.some(c => c.id === newCat.id)) return prev;
                return [...prev, newCat];
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any).id;
              setCategories((prev) => prev.filter(c => c.id !== deletedId));
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Category;
              setCategories((prev) => prev.map(c => c.id === updated.id ? updated : c));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, loadData]);

  // Purge expired archived reels
  useEffect(() => {
    if (!session || reels.length === 0) return;

    const msPerDay = 24 * 60 * 60 * 1000;
    const retentionMs = retentionPeriod === 'day'
      ? 1 * msPerDay
      : retentionPeriod === 'month'
      ? 30 * msPerDay // capped at 30 days
      : 7 * msPerDay; // 1 week default

    const now = Date.now();
    const expiredArchived = reels.filter(r => {
      if (r.completion_status !== 'archived') return false;
      const archiveTimestamp = new Date(r.completed_at || r.created_at).getTime();
      return now - archiveTimestamp > retentionMs;
    });

    if (expiredArchived.length > 0) {
      const expiredIds = expiredArchived.map(r => r.id);
      setReels(prev => prev.filter(r => !expiredIds.includes(r.id)));
      supabase.from('reels').delete().in('id', expiredIds).then();
    }
  }, [reels, retentionPeriod, session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    }
  };

  const handleStatusChange = async (reelId: string, status: 'completed' | 'archived') => {
    const timestamp = new Date().toISOString();
    setReels(prev => prev.map(r => r.id === reelId ? {
      ...r,
      completion_status: status,
      completed_at: timestamp
    } : r));

    const { error } = await supabase.from('reels').update({
      completion_status: status,
      completed_at: timestamp
    }).eq('id', reelId);

    if (error) {
      alert(`Failed to update reel: ${error.message}`);
      await loadData();
    }
  };

  const handleRetryExtraction = async (reelId: string) => {
    setRetryingId(reelId);
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, processing_status: 'pending', is_failed: false } : r));

    try {
      const { error } = await supabase.from('reels').update({
        processing_status: 'pending',
        is_failed: false
      }).eq('id', reelId);

      if (error) {
        alert(`Failed to retry extraction: ${error.message}`);
        setRetryingId(null);
        await loadData();
      }
    } catch (err: any) {
      alert(`Error retrying extraction: ${err.message || err}`);
      setRetryingId(null);
      await loadData();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed || !session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: session.user.id,
          name: trimmed,
          parent_id: categoryParentId || null
        })
        .select()
        .single();

      if (error) {
        alert(`Failed to create category: ${error.message}`);
      } else if (data) {
        setCategories(prev => [...prev, data as Category]);
        setNewCategoryName('');
        setIsCreatingCategory(false);
        setCategoryParentId(null);
      }
    } catch (err: any) {
      alert(`Error creating category: ${err.message || err}`);
    }
  };

  const handleDeleteCategory = async (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this category? Subcategories will also be deleted.')) return;

    setCategories(prev => prev.filter(c => c.id !== catId && c.parent_id !== catId));
    setPinnedFolderIds(prev => prev.filter(id => id !== catId));

    try {
      const { error } = await supabase.from('categories').delete().eq('id', catId);
      if (error) {
        alert(`Failed to delete category: ${error.message}`);
        await loadData();
      }
    } catch (err: any) {
      alert(`Error deleting category: ${err.message || err}`);
      await loadData();
    }
  };

  // User collection export with formula injection prevention & Blob URLs
  const exportData = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const jsonStr = JSON.stringify(reels, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reelvault_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['id', 'url', 'ai_title', 'creator_username', 'difficulty', 'completion_status', 'created_at'];
      // Neutralize spreadsheet formula injection (=, +, -, @, \t, \r)
      const sanitizeCell = (val: string | null | undefined) => {
        let text = val ? String(val) : '';
        if (/^[=+\-@\t\r]/.test(text)) {
          text = "'" + text;
        }
        return `"${text.replace(/"/g, '""')}"`;
      };

      const rows = reels.map(r => [
        sanitizeCell(r.id),
        sanitizeCell(r.url),
        sanitizeCell(r.ai_title),
        sanitizeCell(r.creator_username),
        sanitizeCell(r.difficulty),
        sanitizeCell(r.completion_status),
        sanitizeCell(r.created_at)
      ]);

      const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows.map(e => e.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reelvault_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordMsg(error.message);
    else {
      setPasswordMsg('Password updated successfully!');
      setNewPassword('');
    }
  };

  // Remove Device
  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Remove this device registration?')) return;
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    const { error } = await supabase.from('devices').delete().eq('id', deviceId);
    if (error) {
      alert(`Failed to remove device: ${error.message}`);
      await loadData();
    }
  };

  // Filtered reels according to active page and search
  const displayedReels = useMemo(() => {
    return reels.filter((reel) => {
      const matchesSearch = searchQuery
        ? (reel.ai_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           reel.ai_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           reel.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           reel.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           reel.creator_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           reel.url.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      if (!matchesSearch) return false;

      // Filter based on currentPage
      switch (currentPage) {
        case 'all':
          // All reels except archived
          return reel.completion_status !== 'archived';
        case 'watched':
          // All reels that are checked off completed
          return reel.completion_status === 'completed';
        case 'inbox':
          return reel.processing_status === 'pending' || reel.processing_status === 'resolving';
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
  }, [reels, currentPage, selectedCategoryId, searchQuery]);

  // Insights / "What it says about user" (only includes categorized reels)
  const userPersonaInsight = useMemo(() => {
    if (reels.length === 0) return 'Save a few reels to generate your personalized interest profile.';
    const counts: Record<string, number> = {};
    let categorizedCount = 0;
    for (const r of reels) {
      if (!r.category_id) continue;
      const cat = categories.find(c => c.id === r.category_id)?.name;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
        categorizedCount++;
      }
    }
    if (categorizedCount === 0) {
      return 'Your vault captures a diverse set of topics with active curiosity.';
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const top2 = sorted[1];
    if (top) {
      return `You are intensely drawn to ${top[0]}${top2 ? ` and ${top2[0]}` : ''}. You curate high-value knowledge and entertainment in rapid succession, with a strong focus on actionable and trending content.`;
    }
    return 'Your vault captures a diverse set of topics with active curiosity.';
  }, [reels, categories]);

  // Root categories
  const rootCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  // Pinned categories for navigation
  const pinnedCategories = useMemo(() => {
    return categories.filter(c => pinnedFolderIds.includes(c.id));
  }, [categories, pinnedFolderIds]);

  const counts = useMemo(() => ({
    all: reels.filter(r => r.completion_status !== 'archived').length,
    inbox: reels.filter(r => r.processing_status === 'pending' || r.processing_status === 'resolving').length,
    failed: reels.filter(r => r.is_failed || r.processing_status === 'extraction_failed').length,
    watched: reels.filter(r => r.completion_status === 'completed').length,
    archived: reels.filter(r => r.completion_status === 'archived').length,
    categories: categories.length
  }), [reels, categories]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">ReelVault</h1>
            <p className="mt-2 text-sm text-zinc-400">Capture effortlessly. Organize intelligently.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="rounded-lg bg-red-950/50 p-3 text-xs text-red-400 border border-red-800/50">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setAuthError(null);
              }}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-zinc-950 text-zinc-100'} font-sans`}>
      {/* Navigation Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } transition-all duration-200 border-r border-zinc-800 bg-zinc-900/40 p-3 flex flex-col justify-between select-none`}
      >
        <div className="overflow-y-auto overflow-x-hidden">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between px-2 py-3 mb-2">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <span className="text-lg font-bold tracking-tight text-white">ReelVault</span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          {/* Core Navigation Items */}
          <div className="space-y-1">
            <button
              onClick={() => { setCurrentPage('home'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                currentPage === 'home' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              title="Home (Stats & Insights)"
            >
              <Home className="h-4 w-4 shrink-0 text-indigo-400" />
              {!sidebarCollapsed && <span>Home</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('all'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                currentPage === 'all' && !selectedCategoryId ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              title="All Reels (Except Archived)"
            >
              <div className="flex items-center gap-2.5">
                <Film className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>All Reels</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.all}</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('categories'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                currentPage === 'categories' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              title="Sorted Saves & Categories"
            >
              <div className="flex items-center gap-2.5">
                <FolderTree className="h-4 w-4 shrink-0 text-indigo-400" />
                {!sidebarCollapsed && <span>Sorted Saves</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.categories}</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('watched'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                currentPage === 'watched' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              title="Watched Reels"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                {!sidebarCollapsed && <span>Watched</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.watched}</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('inbox'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                currentPage === 'inbox' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              title="Inbox"
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Inbox</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.inbox}</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('failed'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                currentPage === 'failed' ? 'bg-red-500/15 text-red-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              title="Failed Extractions"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                {!sidebarCollapsed && <span>Failed</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-red-400 font-semibold">{counts.failed}</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('archived'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                currentPage === 'archived' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              title="Archived"
            >
              <div className="flex items-center gap-2.5">
                <Archive className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Archived</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.archived}</span>}
            </button>
          </div>

          {/* Pinned Folders Section */}
          <div className="mt-5 space-y-1">
            {!sidebarCollapsed && (
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Pin className="h-3 w-3 text-indigo-400" />
                <span>Pinned Folders</span>
              </div>
            )}
            {pinnedCategories.map((cat) => {
              const count = reels.filter(r => r.category_id === cat.id || r.subcategory_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCurrentPage('categories');
                    setSelectedCategoryId(cat.id);
                  }}
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition group ${
                    currentPage === 'categories' && selectedCategoryId === cat.id ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                  title={cat.name}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Tag className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    {!sidebarCollapsed && <span className="truncate">{cat.name}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500">{count}</span>
                      <span
                        onClick={(e) => togglePin(cat.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-amber-400 p-0.5 rounded transition"
                      >
                        <PinOff className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: Settings & Sign Out */}
        <div className="border-t border-zinc-800/80 pt-3 mt-2 space-y-1">
          <button
            onClick={() => setCurrentPage('settings')}
            className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              currentPage === 'settings' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
            title="Settings"
          >
            <SettingsIcon className="h-3.5 w-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>

          <button
            onClick={() => supabase.auth.signOut()}
            className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'} rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-red-400 transition`}
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3.5">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold text-white tracking-tight capitalize">
              {currentPage === 'home' && 'Vault Analytics & Overview'}
              {currentPage === 'all' && 'All Saved Reels'}
              {currentPage === 'categories' && (selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || 'Categories' : 'Sorted Saves & Folders')}
              {currentPage === 'watched' && 'Watched Reels'}
              {currentPage === 'inbox' && 'Inbox (Processing)'}
              {currentPage === 'failed' && 'Failed Extractions'}
              {currentPage === 'archived' && 'Archived Reels'}
              {currentPage === 'settings' && 'Settings'}
            </h2>

            {currentPage !== 'home' && currentPage !== 'settings' && !(currentPage === 'categories' && !selectedCategoryId) && (
              <div className="flex items-center gap-2 w-80 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reels by title, summary, or creator..."
                  className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadData()}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700/80 active:scale-95 transition"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* HOME VIEW: STATS & INSIGHTS */}
          {currentPage === 'home' && (
            <div className="space-y-6 max-w-6xl">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-500 block mb-1">Total Saved Reels</span>
                  <div className="text-2xl font-bold text-white">{reels.length}</div>
                  <span className="text-[11px] text-indigo-400 mt-1 block">
                    {counts.watched} completed ({reels.length > 0 ? Math.round((counts.watched / reels.length) * 100) : 0}%)
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-500 block mb-1">Total Folders / Categories</span>
                  <div className="text-2xl font-bold text-white">{categories.length}</div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    {rootCategories.length} primary, {categories.length - rootCategories.length} subfolders
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-500 block mb-1">Processing Success Rate</span>
                  <div className="text-2xl font-bold text-emerald-400">
                    {reels.length > 0 ? Math.round(((reels.length - counts.failed) / reels.length) * 100) : 100}%
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    {counts.failed} failed extractions
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-500 block mb-1">Synced Devices</span>
                  <div className="text-2xl font-bold text-white">{devices.length}</div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    {devices.length > 0 ? (devices[0]?.device_name || 'Active Android') : 'No devices yet'}
                  </span>
                </div>
              </div>

              {/* What it says about the user */}
              <div className="rounded-xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/40 to-zinc-900/60 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">What Your Saves Say About You</h3>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {userPersonaInsight}
                </p>
              </div>

              {/* Reel Types Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-indigo-400" />
                    <span>Distribution by Category</span>
                  </h3>
                  <div className="space-y-3">
                    {rootCategories.map(cat => {
                      const count = reels.filter(r => r.category_id === cat.id).length;
                      const pct = reels.length > 0 ? Math.round((count / reels.length) * 100) : 0;
                      return (
                        <div key={cat.id}>
                          <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                            <span>{cat.name}</span>
                            <span className="text-zinc-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty & Engagement Types */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <span>Content Complexity</span>
                  </h3>
                  <div className="space-y-3">
                    {['General', 'Beginner', 'Intermediate', 'Advanced'].map(diff => {
                      const count = reels.filter(r => (r.difficulty || 'General') === diff).length;
                      const pct = reels.length > 0 ? Math.round((count / reels.length) * 100) : 0;
                      return (
                        <div key={diff}>
                          <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                            <span>{diff}</span>
                            <span className="text-zinc-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES PAGE: HIERARCHY & LIGHTBOX */}
          {currentPage === 'categories' && !selectedCategoryId && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Hierarchical Categories</h3>
                  <p className="text-xs text-zinc-400">Drill down up to {maxGenerations} generations deep or open in lightbox.</p>
                </div>
                <button
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              {isCreatingCategory && (
                <form onSubmit={handleCreateCategory} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 flex flex-wrap gap-2">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name..."
                    className="flex-1 min-w-[200px] rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white"
                  />
                  <select
                    value={categoryParentId || ''}
                    onChange={(e) => setCategoryParentId(e.target.value || null)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
                  >
                    <option value="">Top-Level</option>
                    {rootCategories.map(rc => (
                      <option key={rc.id} value={rc.id}>↳ {rc.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
                    Create
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rootCategories.map(cat => {
                  const subcats = getSubcategories(cat.id);
                  const count = reels.filter(r => r.category_id === cat.id).length;
                  const isPinned = pinnedFolderIds.includes(cat.id);

                  return (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => setCategoryLightbox(cat)}
                            className="text-sm font-semibold text-white hover:text-indigo-400 flex items-center gap-1.5 transition text-left"
                          >
                            <Folder className="h-4 w-4 text-indigo-400 shrink-0" />
                            <span>{cat.name}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => togglePin(cat.id)}
                              className={`p-1 rounded text-xs transition ${isPinned ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-300'}`}
                              title={isPinned ? 'Unpin' : 'Pin'}
                            >
                              <Pin className={`h-3 w-3 ${isPinned ? 'fill-indigo-400' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1 rounded text-zinc-600 hover:text-red-400 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-500 mb-3">{count} saved reels</p>

                        {/* Subcategories (Level 2) */}
                        {subcats.length > 0 && (
                          <div className="pl-3 border-l border-zinc-800 space-y-1">
                            {subcats.slice(0, 4).map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => setCategoryLightbox(sub)}
                                className="block w-full text-left text-[11px] text-zinc-400 hover:text-indigo-300 truncate"
                              >
                                ↳ {sub.name} ({reels.filter(r => r.subcategory_id === sub.id).length})
                              </button>
                            ))}
                            {subcats.length > 4 && (
                              <span className="text-[10px] text-zinc-600 italic block">
                                +{subcats.length - 4} more subcategories
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between">
                        <button
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          View Reels →
                        </button>
                        <button
                          onClick={() => setCategoryLightbox(cat)}
                          className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                          Inspect Hierarchy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REELS GRID / LIST VIEW */}
          {(currentPage !== 'home' && currentPage !== 'settings' && (currentPage !== 'categories' || selectedCategoryId)) && (
            <div>
              {selectedCategoryId && (
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    ← Back to All Categories
                  </button>
                  <span className="text-zinc-600">/</span>
                  <span className="text-xs text-zinc-300 font-semibold">
                    {categories.find(c => c.id === selectedCategoryId)?.name}
                  </span>
                </div>
              )}

              {displayedReels.length === 0 ? (
                <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-center">
                  <Film className="h-10 w-10 text-zinc-600 mb-2" />
                  <p className="text-xs font-medium text-zinc-400">No reels found in this view</p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Share a Reel from your phone via ReelVault to see it appear here.
                  </p>
                </div>
              ) : (
                <div className={viewLayout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-3"}>
                  {displayedReels.map((reel) => {
                    const extractionErr = Array.isArray(reel.extracted_content)
                      ? reel.extracted_content[0]?.extraction_error
                      : reel.extracted_content?.extraction_error;
                    const isThisRetrying = retryingId === reel.id || reel.processing_status === 'pending' || reel.processing_status === 'resolving';

                    const catObj = categories.find(c => c.id === reel.category_id);
                    const subObj = categories.find(c => c.id === reel.subcategory_id);

                    return (
                      <div
                        key={reel.id}
                        onClick={() => setDetailReelId(reel.id)}
                        className={`flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 ${density === 'compact' ? 'p-3' : 'p-4'} backdrop-blur hover:border-zinc-700 cursor-pointer transition`}
                      >
                        <div>
                          {/* Thumbnail */}
                          {showThumbnails && reel.thumbnail_url ? (
                            <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-zinc-800">
                              <img
                                src={reel.thumbnail_url}
                                alt="Reel thumbnail"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : null}

                          {/* Header badges */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                                  reel.is_failed || reel.processing_status === 'extraction_failed'
                                    ? 'bg-red-950/80 text-red-400 border border-red-800/50'
                                    : reel.processing_status === 'processed'
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {reel.processing_status}
                              </span>

                              {catObj && (
                                <span className="rounded bg-indigo-950/60 px-1.5 py-0.5 text-[9px] font-medium text-indigo-300 border border-indigo-800/40">
                                  {catObj.name}{subObj ? ` / ${subObj.name}` : ''}
                                </span>
                              )}
                            </div>

                            {reel.difficulty && (
                              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300">
                                {reel.difficulty}
                              </span>
                            )}
                          </div>

                          {/* Title & Creator */}
                          <h3 className="font-semibold text-white leading-tight text-sm mb-1 line-clamp-2">
                            {reel.ai_title || (reel.creator_username ? `@${reel.creator_username}'s Reel` : 'Instagram Reel')}
                          </h3>

                          {reel.creator_username && (
                            <p className="text-[11px] font-mono text-zinc-400 mb-2">@{reel.creator_username}</p>
                          )}

                          {/* AI Summary / Description */}
                          <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                            {reel.ai_summary || reel.ai_description || reel.caption || 'No summary available'}
                          </p>

                          {/* Extraction Error Banner for failed reels */}
                          {(reel.is_failed || reel.processing_status === 'extraction_failed') && extractionErr && (
                            <div className="mb-3 rounded bg-red-950/40 p-2 text-[11px] text-red-300 border border-red-900/40">
                              <span className="font-semibold block mb-0.5">Extraction Issue:</span>
                              <span className="font-mono text-[10px] break-all line-clamp-2">{extractionErr}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="border-t border-zinc-800/80 pt-3 mt-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-2">
                            <a
                              href={reel.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                            >
                              <span>Open Reel</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>

                            <span className="text-[10px] text-zinc-500">
                              {new Date(reel.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                              <button
                                onClick={() => handleRetryExtraction(reel.id)}
                                disabled={isThisRetrying}
                                className="flex-1 flex items-center justify-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 py-1 text-xs text-zinc-200"
                              >
                                <RotateCcw className={`h-3 w-3 ${isThisRetrying ? 'animate-spin text-indigo-400' : ''}`} />
                                <span>Retry</span>
                              </button>
                            )}

                            {reel.completion_status !== 'completed' && (
                              <button
                                onClick={() => handleStatusChange(reel.id, 'completed')}
                                className="flex-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 py-1 text-xs font-medium text-emerald-300 transition"
                              >
                                Watched
                              </button>
                            )}

                            {reel.completion_status !== 'archived' && (
                              <button
                                onClick={() => handleStatusChange(reel.id, 'archived')}
                                className="flex-1 rounded bg-zinc-800 hover:bg-zinc-700 py-1 text-xs font-medium text-zinc-300 transition"
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS VIEW: 6 COMPREHENSIVE SECTIONS */}
          {currentPage === 'settings' && (
            <div className="max-w-4xl space-y-8">
              {/* Section 1: Account Settings */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-400" />
                  <span>1. Account Settings</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Email Address</label>
                    <input
                      type="text"
                      disabled
                      value={session?.user?.email || ''}
                      className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Account Created At</label>
                    <span className="text-xs text-zinc-300 font-mono">
                      {new Date(session?.user?.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <form onSubmit={handleChangePassword} className="pt-2">
                    <label className="text-xs text-zinc-400 block mb-1">Change Password</label>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="password"
                        placeholder="New password (min 6 chars)..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white"
                      />
                      <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">
                        Update
                      </button>
                    </div>
                    {passwordMsg && <p className="text-xs text-indigo-400 mt-1">{passwordMsg}</p>}
                  </form>
                </div>
              </div>

              {/* Section 2: Ingestion & Extraction Rules */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-400" />
                    <span>2. Reel Ingestion &amp; Processing Controls</span>
                  </h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                    Backend Managed
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between max-w-xl py-1 border-b border-zinc-850">
                    <div>
                      <span className="text-xs font-medium text-zinc-300 block">Automatically process new Reels</span>
                      <span className="text-[11px] text-zinc-500">Trigger OpenGraph &amp; AI categorization immediately upon receipt</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      Active (Always On)
                    </span>
                  </div>

                  <div className="flex items-center justify-between max-w-xl py-1 border-b border-zinc-850">
                    <div>
                      <span className="text-xs font-medium text-zinc-300 block">Detect duplicate URLs</span>
                      <span className="text-[11px] text-zinc-500">Prevent adding the exact same Instagram Reel multiple times</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      Active (Enforced)
                    </span>
                  </div>

                  <div className="flex items-center justify-between max-w-xl py-1 border-b border-zinc-850">
                    <div>
                      <span className="text-xs font-medium text-zinc-300 block">Keep failed Reels in library</span>
                      <span className="text-[11px] text-zinc-500">Retain unresolvable reels in the Failed folder for manual retries</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      Active (Enforced)
                    </span>
                  </div>

                  <div className="flex items-center justify-between max-w-xl py-1 border-b border-zinc-850">
                    <div>
                      <span className="text-xs font-medium text-zinc-300 block">Automatically retry failed extraction</span>
                      <span className="text-[11px] text-zinc-500">Bounded retries with exponential backoff on network failures</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      Active (Worker)
                    </span>
                  </div>

                  <div className="flex items-center justify-between max-w-xl py-1">
                    <div>
                      <span className="text-xs font-medium text-zinc-300 block">Desktop processing notifications</span>
                      <span className="text-[11px] text-zinc-500">Native browser notifications when extraction completes</span>
                    </div>
                    <span className="text-xs text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Appearance & Display Preferences */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-400" />
                  <span>3. Appearance &amp; Density</span>
                </h3>

                <div className="space-y-4 max-w-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-300 block">Theme</span>
                      <span className="text-[11px] text-zinc-500">Full light theme coming in a future update</span>
                    </div>
                    <select
                      value="dark"
                      disabled
                      className="bg-zinc-900 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-400 cursor-not-allowed"
                    >
                      <option value="dark">Dark (Default)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300">Card Density</span>
                    <select
                      value={density}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setDensity(val);
                        localStorage.setItem('reelvault_density', val);
                      }}
                      className="bg-zinc-800 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200"
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300">Default Layout</span>
                    <select
                      value={viewLayout}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setViewLayout(val);
                        localStorage.setItem('reelvault_view_layout', val);
                      }}
                      className="bg-zinc-800 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200"
                    >
                      <option value="grid">Grid</option>
                      <option value="list">List</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300">Display Thumbnails</span>
                    <input
                      type="checkbox"
                      checked={showThumbnails}
                      onChange={(e) => {
                        setShowThumbnails(e.target.checked);
                        localStorage.setItem('reelvault_show_thumbnails', String(e.target.checked));
                      }}
                      className="rounded accent-indigo-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-300 block">Category Depth Generations</span>
                      <span className="text-[11px] text-zinc-500">Max tree depth before requiring drill-down expansion</span>
                    </div>
                    <select
                      value={maxGenerations}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setMaxGenerations(val);
                        localStorage.setItem('reelvault_max_generations', String(val));
                      }}
                      className="bg-zinc-800 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200"
                    >
                      <option value="2">2 Generations</option>
                      <option value="3">3 Generations (Default)</option>
                      <option value="4">4 Generations</option>
                      <option value="5">5 Generations</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Archive Auto-Delete & Retention Cap */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>4. Archive Auto-Delete &amp; Retention Cap</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-3">
                  Archiving a reel moves it out of regular view. It will be permanently deleted after the chosen retention period. Cap is 1 month.
                </p>

                <div className="grid grid-cols-3 gap-2 max-w-md bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => {
                      setRetentionPeriod('day');
                      localStorage.setItem('reelvault_archive_retention', 'day');
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${
                      retentionPeriod === 'day' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1 Day
                  </button>
                  <button
                    onClick={() => {
                      setRetentionPeriod('week');
                      localStorage.setItem('reelvault_archive_retention', 'week');
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${
                      retentionPeriod === 'week' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1 Week
                  </button>
                  <button
                    onClick={() => {
                      setRetentionPeriod('month');
                      localStorage.setItem('reelvault_archive_retention', 'month');
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${
                      retentionPeriod === 'month' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1 Month (Cap)
                  </button>
                </div>
              </div>

              {/* Section 5: Data Management & Export */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Download className="h-4 w-4 text-indigo-400" />
                  <span>5. Data Management &amp; Export</span>
                </h3>

                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">
                    Export your entire curated reel library and metadata to standard formats for permanent offline archival.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => exportData('json')}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export JSON ({reels.length} reels)</span>
                    </button>
                    <button
                      onClick={() => exportData('csv')}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 6: Registered Devices & Synchronization */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-indigo-400" />
                  <span>6. Registered Devices &amp; Synchronization</span>
                </h3>

                <div className="space-y-3">
                  {devices.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No mobile devices registered yet.</p>
                  ) : (
                    devices.map(dev => (
                      <div key={dev.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 max-w-xl">
                        <div>
                          <span className="text-xs font-semibold text-white block">{dev.device_name || 'Android Device'}</span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Last synced: {new Date(dev.last_synced_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveDevice(dev.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}

                  <div className="mt-4 p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 max-w-xl">
                    <span className="font-semibold text-white block mb-0.5">Sync Troubleshooting</span>
                    If reels take longer than a few seconds to appear, ensure the Android app has background battery permissions enabled and active network connectivity.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DEDICATED REEL DETAIL PANEL / LIGHTBOX */}
      {detailReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2 truncate">
                <Film className="h-5 w-5 text-indigo-400 shrink-0" />
                <h3 className="text-base font-bold text-white truncate">
                  {detailReel.ai_title || 'Reel Details'}
                </h3>
              </div>
              <button
                onClick={() => setDetailReelId(null)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Media Preview & Core Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {detailReel.thumbnail_url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-800 border border-zinc-700/50">
                    <img
                      src={detailReel.thumbnail_url}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl bg-zinc-850 flex items-center justify-center text-zinc-600 text-xs">
                    No thumbnail available
                  </div>
                )}

                <div className="flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-indigo-400 block mb-1">Creator</span>
                    <span className="text-sm font-mono text-white">
                      {detailReel.creator_username ? `@${detailReel.creator_username}` : 'Unknown Creator'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">Category &amp; Subcategory</span>
                    <span className="text-xs text-zinc-200">
                      {categories.find(c => c.id === detailReel.category_id)?.name || 'Uncategorized'}
                      {detailReel.subcategory_id && ` / ${categories.find(c => c.id === detailReel.subcategory_id)?.name}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">Complexity / Difficulty</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      {detailReel.difficulty || 'General'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">Saved On</span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {new Date(detailReel.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Title & Summary */}
              {detailReel.ai_summary && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-semibold text-indigo-400 block mb-1">AI Summary</span>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {detailReel.ai_summary}
                  </p>
                </div>
              )}

              {/* AI Description */}
              {detailReel.ai_description && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">AI Description</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {detailReel.ai_description}
                  </p>
                </div>
              )}

              {/* Full Original Caption */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">Full Caption</span>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {detailReel.caption || detailReel.raw_shared_text || 'No caption found'}
                </p>
              </div>

              {/* Original Instagram Link (Always Clickable Fallback) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                <div>
                  <span className="text-xs font-semibold text-white block">Watch Original Instagram Reel</span>
                  <span className="text-[11px] text-zinc-400 truncate max-w-sm block font-mono">{detailReel.url}</span>
                </div>
                <a
                  href={detailReel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition"
                >
                  <span>Open Instagram</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Footer Completion Controls */}
            <div className="border-t border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-950">
              <span className="text-xs text-zinc-500 capitalize">
                Status: {detailReel.completion_status} ({detailReel.processing_status})
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(detailReel.id, 'completed')}
                  className="rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 transition"
                >
                  Mark Watched
                </button>
                <button
                  onClick={() => handleStatusChange(detailReel.id, 'archived')}
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition"
                >
                  Archive Reel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY DRILL-DOWN LIGHTBOX (3 GENERATIONS DEEP) */}
      {categoryLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">{categoryLightbox.name}</h3>
              </div>
              <button
                onClick={() => setCategoryLightbox(null)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Subcategories (max depth: {maxGenerations} generations)
                </span>
                <button
                  onClick={() => {
                    setSelectedCategoryId(categoryLightbox.id);
                    setCategoryLightbox(null);
                  }}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  View All Reels in Category →
                </button>
              </div>

              {/* Subcategories Tree */}
              <div className="space-y-2">
                {getSubcategories(categoryLightbox.id).map(sub => {
                  const subSub = maxGenerations >= 3 ? getSubcategories(sub.id) : [];
                  return (
                    <div key={sub.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">↳ {sub.name}</span>
                        <span className="text-[10px] text-zinc-500">
                          {reels.filter(r => r.subcategory_id === sub.id).length} reels
                        </span>
                      </div>

                      {/* Generation 3: Deeper Sub-subcategories (conditioned on maxGenerations) */}
                      {subSub.length > 0 && (
                        <div className="mt-2 ml-4 pl-3 border-l border-zinc-800 space-y-1">
                          {subSub.map(s3 => (
                            <div key={s3.id} className="text-[11px] text-zinc-400">
                              ↳↳ {s3.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
