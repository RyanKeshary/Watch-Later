'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Reel, Category } from '@/types/database';
import {
  Folder,
  Inbox,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Archive,
  RefreshCw,
  ExternalLink,
  Search,
  LogOut,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Pin,
  PinOff,
  FolderTree,
  Clock,
  Layers,
  Tag
} from 'lucide-react';

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [reels, setReels] = useState<Reel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [systemFoldersCollapsed, setSystemFoldersCollapsed] = useState(false);
  const [pinnedFoldersCollapsed, setPinnedFoldersCollapsed] = useState(false);
  const [showSortedSavesModal, setShowSortedSavesModal] = useState(false);

  // Pinned folder IDs (stored in localStorage)
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);

  // Category creation
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Archive retention setting: 'day' (1 day), 'week' (7 days), 'month' (30 days - cap)
  const [retentionPeriod, setRetentionPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Load pinned folders & retention period from localStorage
  useEffect(() => {
    try {
      const savedPins = localStorage.getItem('reelvault_pinned_folders');
      if (savedPins) {
        setPinnedFolderIds(JSON.parse(savedPins));
      }
      const savedRetention = localStorage.getItem('reelvault_archive_retention') as 'day' | 'week' | 'month';
      if (savedRetention) {
        setRetentionPeriod(savedRetention);
      }
    } catch (e) {
      // Ignore localStorage access issues
    }
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

  const handleRetentionChange = (period: 'day' | 'week' | 'month') => {
    setRetentionPeriod(period);
    try {
      localStorage.setItem('reelvault_archive_retention', period);
    } catch (err) {}
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

      // Paginate through all reels beyond PostgREST default limit
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

      const { data: catsData, error: catsErr } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      // Verify session user hasn't changed while request was in-flight
      const { data: { session: latestSession } } = await supabase.auth.getSession();
      if (latestSession?.user?.id === requestUserId) {
        setReels(allReels);
        if (!catsErr && catsData) setCategories(catsData as Category[]);
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
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
        } else if (prevSession?.user?.id && newSession?.user?.id !== prevSession.user.id) {
          setReels([]);
          setCategories([]);
        }
        return newSession;
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadData();

      // Listen for instant real-time changes
      const channel = supabase
        .channel('realtime_reels_and_categories')
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
              setReels((prev) => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
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

  // Purge expired archived reels from the dashboard and database based on retentionPeriod
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
      // Remove instantly from local view
      setReels(prev => prev.filter(r => !expiredIds.includes(r.id)));
      // Delete in database in background
      supabase.from('reels').delete().in('id', expiredIds).then(({ error }) => {
        if (error) console.error('Failed to purge expired archived reels:', error);
      });
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
    // Instant optimistic update
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

  const handleDeleteCategory = async (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this folder/category? Subcategories will also be deleted.')) {
      return;
    }

    setCategories(prev => prev.filter(c => c.id !== catId && c.parent_id !== catId));
    setPinnedFolderIds(prev => prev.filter(id => id !== catId));
    if (activeFolder === catId) {
      setActiveFolder('all');
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', catId);

      if (error) {
        alert(`Failed to delete category: ${error.message}`);
        await loadData();
      }
    } catch (err: any) {
      alert(`Error deleting category: ${err.message || err}`);
      await loadData();
    }
  };

  // Filter reels based on smart/system folder or category
  const filteredReels = useMemo(() => {
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

      switch (activeFolder) {
        case 'all':
          return true;
        case 'inbox':
          return reel.processing_status === 'pending' || reel.processing_status === 'resolving';
        case 'uncategorized':
          return reel.processing_status === 'partially_processed' && !reel.category_id;
        case 'failed':
          return reel.is_failed || reel.processing_status === 'extraction_failed';
        case 'completed':
          return reel.completion_status === 'completed';
        case 'archived':
          return reel.completion_status === 'archived';
        default:
          return reel.category_id === activeFolder || reel.subcategory_id === activeFolder;
      }
    });
  }, [reels, activeFolder, searchQuery]);

  const getSystemCounts = () => ({
    all: reels.length,
    inbox: reels.filter(r => r.processing_status === 'pending' || r.processing_status === 'resolving').length,
    uncategorized: reels.filter(r => r.processing_status === 'partially_processed' && !r.category_id).length,
    failed: reels.filter(r => r.is_failed || r.processing_status === 'extraction_failed').length,
    completed: reels.filter(r => r.completion_status === 'completed').length,
    archived: reels.filter(r => r.completion_status === 'archived').length,
  });

  const counts = getSystemCounts();

  // Root categories and subcategories
  const rootCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  // Only pinned folders shown directly in nav panel
  const pinnedCategories = useMemo(() => {
    return categories.filter(c => pinnedFolderIds.includes(c.id));
  }, [categories, pinnedFolderIds]);

  // Active view name
  const activeViewTitle = useMemo(() => {
    switch (activeFolder) {
      case 'all': return 'All Reels';
      case 'inbox': return 'Inbox';
      case 'uncategorized': return 'Uncategorized';
      case 'failed': return 'Failed Extractions';
      case 'completed': return 'Completed';
      case 'archived': return 'Archived';
      default: {
        const found = categories.find(c => c.id === activeFolder);
        return found ? found.name : 'Reels';
      }
    }
  }, [activeFolder, categories]);

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
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } transition-all duration-200 border-r border-zinc-800 bg-zinc-900/40 p-3 flex flex-col justify-between select-none`}
      >
        <div className="overflow-y-auto overflow-x-hidden">
          {/* Header & Collapse toggle */}
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

          {/* Sorted Saves (Nav item to open full folder hierarchy) */}
          <div className="mb-3">
            <button
              onClick={() => setShowSortedSavesModal(true)}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 transition shadow-sm`}
              title="Open Sorted Saves"
            >
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-indigo-400 shrink-0" />
                {!sidebarCollapsed && <span>Sorted Saves</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-300 font-mono">
                  {categories.length}
                </span>
              )}
            </button>
          </div>

          {/* System Folders */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <button
                onClick={() => setSystemFoldersCollapsed(!systemFoldersCollapsed)}
                className="flex w-full items-center justify-between px-2 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition"
              >
                <span>System Folders</span>
                {systemFoldersCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            ) : null}

            {(!systemFoldersCollapsed || sidebarCollapsed) && (
              <>
                <button
                  onClick={() => setActiveFolder('all')}
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activeFolder === 'all' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                  title="All Reels"
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>All Reels</span>}
                  </div>
                  {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.all}</span>}
                </button>

                <button
                  onClick={() => setActiveFolder('inbox')}
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activeFolder === 'inbox' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
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
                  onClick={() => setActiveFolder('uncategorized')}
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activeFolder === 'uncategorized' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                  title="Uncategorized"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>Uncategorized</span>}
                  </div>
                  {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.uncategorized}</span>}
                </button>

                <button
                  onClick={() => setActiveFolder('failed')}
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activeFolder === 'failed' ? 'bg-red-500/15 text-red-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                  title="Failed"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                    {!sidebarCollapsed && <span>Failed</span>}
                  </div>
                  {!sidebarCollapsed && <span className="text-[11px] text-red-400 font-semibold">{counts.failed}</span>}
                </button>

                <button
                  onClick={() => setActiveFolder('completed')}
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activeFolder === 'completed' ? 'bg-emerald-500/15 text-emerald-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                  title="Completed"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    {!sidebarCollapsed && <span>Completed</span>}
                  </div>
                  {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.completed}</span>}
                </button>

                <button
                  onClick={() => setActiveFolder('archived')}
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activeFolder === 'archived' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                  title="Archived"
                >
                  <div className="flex items-center gap-2.5">
                    <Archive className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>Archived</span>}
                  </div>
                  {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.archived}</span>}
                </button>
              </>
            )}
          </div>

          {/* Pinned Folders in Nav Panel */}
          <div className="mt-5 space-y-1">
            {!sidebarCollapsed ? (
              <button
                onClick={() => setPinnedFoldersCollapsed(!pinnedFoldersCollapsed)}
                className="flex w-full items-center justify-between px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition"
              >
                <div className="flex items-center gap-1.5">
                  <Pin className="h-3 w-3 text-indigo-400" />
                  <span>Pinned Folders ({pinnedCategories.length})</span>
                </div>
                {pinnedFoldersCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            ) : null}

            {(!pinnedFoldersCollapsed || sidebarCollapsed) && (
              <>
                {pinnedCategories.length === 0 && !sidebarCollapsed && (
                  <div className="px-2 py-1 text-[11px] text-zinc-600 italic">
                    No pinned folders. Pin from &quot;Sorted Saves&quot;.
                  </div>
                )}

                {pinnedCategories.map((cat) => {
                  const count = reels.filter(r => r.category_id === cat.id || r.subcategory_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFolder(cat.id)}
                      className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition group ${
                        activeFolder === cat.id ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
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
                            title="Unpin folder"
                          >
                            <PinOff className="h-3 w-3" />
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* User Info & Archive Retention Cap Settings */}
        <div className="border-t border-zinc-800/80 pt-3 mt-2">
          {!sidebarCollapsed && (
            <div className="mb-2 px-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  Auto-Delete
                </span>
                <span className="text-zinc-500 font-mono">Cap: 30d</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                <button
                  onClick={() => handleRetentionChange('day')}
                  className={`py-1 text-[10px] font-medium rounded transition ${
                    retentionPeriod === 'day' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Purge archived reels after 1 day"
                >
                  1 Day
                </button>
                <button
                  onClick={() => handleRetentionChange('week')}
                  className={`py-1 text-[10px] font-medium rounded transition ${
                    retentionPeriod === 'week' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Purge archived reels after 1 week"
                >
                  1 Week
                </button>
                <button
                  onClick={() => handleRetentionChange('month')}
                  className={`py-1 text-[10px] font-medium rounded transition ${
                    retentionPeriod === 'month' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Purge archived reels after 1 month (maximum cap)"
                >
                  1 Month
                </button>
              </div>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="truncate text-[11px] text-zinc-500 px-2 mb-1.5 font-mono">
              {session.user.email}
            </div>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'} rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-red-400 transition`}
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3.5">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span>{activeViewTitle}</span>
              <span className="text-xs font-normal text-zinc-500">({filteredReels.length})</span>
            </h2>
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
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSortedSavesModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/20 active:scale-95 transition"
            >
              <FolderTree className="h-3 w-3" />
              <span>Sorted Saves</span>
            </button>

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

        {/* Reel Grid / Cards */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredReels.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-center">
              <Folder className="h-10 w-10 text-zinc-600 mb-2" />
              <p className="text-xs font-medium text-zinc-400">No reels found in {activeViewTitle}</p>
              <p className="mt-1 text-[11px] text-zinc-600">
                Share a Reel from your phone via ReelVault or change filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredReels.map((reel) => {
                const extractionErr = Array.isArray(reel.extracted_content)
                  ? reel.extracted_content[0]?.extraction_error
                  : reel.extracted_content?.extraction_error;
                const isThisRetrying = retryingId === reel.id || reel.processing_status === 'pending' || reel.processing_status === 'resolving';

                const catObj = categories.find(c => c.id === reel.category_id);
                const subObj = categories.find(c => c.id === reel.subcategory_id);

                return (
                  <div
                    key={reel.id}
                    className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur hover:border-zinc-700 transition"
                  >
                    <div>
                      {/* Thumbnail */}
                      {reel.thumbnail_url ? (
                        <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-zinc-800">
                          <img
                            src={reel.thumbnail_url}
                            alt="Reel thumbnail"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}

                      {/* Header tags & badges */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                              reel.is_failed || reel.processing_status === 'extraction_failed'
                                ? 'bg-red-950/80 text-red-400 border border-red-800/50'
                                : reel.processing_status === 'processed'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                : reel.processing_status === 'resolving' || reel.processing_status === 'pending'
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50 animate-pulse'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {reel.processing_status}
                          </span>

                          {catObj && (
                            <button
                              onClick={() => setActiveFolder(catObj.id)}
                              className="rounded bg-indigo-950/60 hover:bg-indigo-900/80 px-1.5 py-0.5 text-[9px] font-medium text-indigo-300 border border-indigo-800/40 flex items-center gap-1 transition"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {catObj.name}
                              {subObj && ` / ${subObj.name}`}
                            </button>
                          )}
                        </div>

                        {reel.difficulty && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300 border border-zinc-700/50">
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
                      {reel.ai_summary && (
                        <div className="mb-2 p-2 rounded bg-zinc-800/40 border border-zinc-800 text-[11px] text-zinc-300">
                          <span className="text-[10px] uppercase font-semibold text-indigo-400 block mb-0.5">Summary</span>
                          <p className="line-clamp-3">{reel.ai_summary}</p>
                        </div>
                      )}

                      {reel.ai_description && !reel.ai_summary && (
                        <p className="text-xs text-zinc-400 line-clamp-3 mb-3">
                          {reel.ai_description}
                        </p>
                      )}

                      {!reel.ai_summary && !reel.ai_description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                          {reel.caption || reel.raw_shared_text || 'No caption available'}
                        </p>
                      )}

                      {/* Extraction Error Banner */}
                      {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                        <div className="mb-3 rounded-lg bg-red-950/40 p-2 text-xs text-red-300 border border-red-900/40">
                          <p className="font-semibold text-[11px] mb-0.5">Extraction Issue:</p>
                          <p className="font-mono text-[10px] break-all">{extractionErr || 'Unable to retrieve media metadata'}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-zinc-800/80 pt-3 mt-2">
                      <div className="flex items-center justify-between mb-2.5">
                        <a
                          href={reel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                        >
                          <span>Watch on Instagram</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>

                        <span className="text-[10px] text-zinc-500">
                          {new Date(reel.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {(reel.is_failed || reel.processing_status === 'extraction_failed' || reel.processing_status === 'partially_processed') && (
                          <button
                            onClick={() => handleRetryExtraction(reel.id)}
                            disabled={isThisRetrying}
                            className={`flex items-center justify-center gap-1.5 rounded-lg border py-1 px-2.5 text-xs font-medium transition ${
                              reel.is_failed || reel.processing_status === 'extraction_failed'
                                ? 'flex-1 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                                : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title="Retry extraction pipeline"
                          >
                            <RotateCcw className={`h-3 w-3 ${isThisRetrying ? 'animate-spin text-indigo-400' : ''}`} />
                            <span>{isThisRetrying ? 'Extracting...' : 'Retry'}</span>
                          </button>
                        )}

                        {reel.completion_status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(reel.id, 'completed')}
                            className="flex-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 py-1 text-xs font-medium text-emerald-300 transition"
                          >
                            Mark Done
                          </button>
                        )}
                        {reel.completion_status !== 'archived' && (
                          <button
                            onClick={() => handleStatusChange(reel.id, 'archived')}
                            className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 py-1 text-xs font-medium text-zinc-300 transition"
                            title={`Archive reel (auto-deletes after ${retentionPeriod === 'day' ? '1 day' : retentionPeriod === 'week' ? '1 week' : '1 month'})`}
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
      </main>

      {/* Sorted Saves Modal / Explorer */}
      {showSortedSavesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <FolderTree className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Sorted Saves &amp; Folders</h3>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {categories.length} folders
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() => setShowSortedSavesModal(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Create Category Form in Modal */}
            {isCreatingCategory && (
              <form onSubmit={handleCreateCategory} className="border-b border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter folder/category name..."
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={categoryParentId || ''}
                    onChange={(e) => setCategoryParentId(e.target.value || null)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Top-Level Folder</option>
                    {rootCategories.map(rc => (
                      <option key={rc.id} value={rc.id}>Nested under: {rc.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setIsCreatingCategory(false); setNewCategoryName(''); }}
                      className="px-3 py-1.5 text-xs rounded-lg text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Modal Body: All folders & categories with deeper hierarchy */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {rootCategories.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  No folders or categorizations found. Create your first folder above!
                </div>
              ) : (
                rootCategories.map((cat) => {
                  const subcats = getSubcategories(cat.id);
                  const isPinned = pinnedFolderIds.includes(cat.id);
                  const catReelsCount = reels.filter(r => r.category_id === cat.id).length;

                  return (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3.5 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          onClick={() => {
                            setActiveFolder(cat.id);
                            setShowSortedSavesModal(false);
                          }}
                          className="flex items-center gap-2.5 cursor-pointer flex-1"
                        >
                          <Folder className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm font-semibold text-white hover:text-indigo-300 transition">
                            {cat.name}
                          </span>
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                            {catReelsCount} {catReelsCount === 1 ? 'reel' : 'reels'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePin(cat.id)}
                            className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                              isPinned
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            }`}
                            title={isPinned ? 'Unpin from Nav Panel' : 'Pin to Nav Panel'}
                          >
                            <Pin className={`h-3 w-3 ${isPinned ? 'fill-indigo-400 text-indigo-400' : ''}`} />
                            <span className="text-[11px]">{isPinned ? 'Pinned' : 'Pin'}</span>
                          </button>

                          <button
                            onClick={(e) => handleDeleteCategory(cat.id, e)}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                            title="Delete category"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Deeper Hierarchical Subcategories */}
                      {subcats.length > 0 && (
                        <div className="mt-3 ml-4 pl-3 border-l-2 border-zinc-800 space-y-1.5">
                          {subcats.map((sub) => {
                            const isSubPinned = pinnedFolderIds.includes(sub.id);
                            const subCount = reels.filter(r => r.subcategory_id === sub.id).length;

                            return (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-850/50 transition group"
                              >
                                <div
                                  onClick={() => {
                                    setActiveFolder(sub.id);
                                    setShowSortedSavesModal(false);
                                  }}
                                  className="flex items-center gap-2 cursor-pointer flex-1"
                                >
                                  <span className="text-zinc-500 text-xs">↳</span>
                                  <span className="text-xs font-medium text-zinc-300 hover:text-indigo-300 transition">
                                    {sub.name}
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    ({subCount})
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => togglePin(sub.id)}
                                    className={`p-1 rounded transition ${
                                      isSubPinned ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-300'
                                    }`}
                                    title={isSubPinned ? 'Unpin from Nav' : 'Pin to Nav'}
                                  >
                                    <Pin className={`h-3 w-3 ${isSubPinned ? 'fill-indigo-400' : ''}`} />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteCategory(sub.id, e)}
                                    className="p-1 rounded text-zinc-600 hover:text-red-400 transition"
                                    title="Delete subfolder"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
