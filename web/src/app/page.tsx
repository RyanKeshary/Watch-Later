'use client';

import { useState, useEffect, useCallback } from 'react';
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
  RotateCcw
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

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user?.id) {
        setRefreshing(false);
        return;
      }
      const requestUserId = currentSession.user.id;

      // Paginate through all reels beyond PostgREST default limit (1000 per page)
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
      // Clear data on sign-out or when active user changes
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
    }
  }, [session, loadData]);

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
    const { error } = await supabase.from('reels').update({
      completion_status: status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    }).eq('id', reelId);

    if (error) {
      alert(`Failed to update reel: ${error.message}`);
      return;
    }
    await loadData();
  };

  const handleRetryExtraction = async (reelId: string) => {
    setRetryingId(reelId);
    try {
      const { error } = await supabase.from('reels').update({
        processing_status: 'pending',
        is_failed: false
      }).eq('id', reelId);

      if (error) {
        alert(`Failed to retry extraction: ${error.message}`);
        setRetryingId(null);
        return;
      }

      // Optimistically update UI only after successful update
      setReels(prev => prev.map(r => r.id === reelId ? { ...r, processing_status: 'pending', is_failed: false } : r));

      setTimeout(async () => {
        await loadData();
        setRetryingId(null);
      }, 3000);
    } catch (err: any) {
      alert(`Error retrying extraction: ${err.message || err}`);
      setRetryingId(null);
    }
  };

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

  // Filter reels based on smart/system folder
  const filteredReels = reels.filter((reel) => {
    const matchesSearch = searchQuery
      ? (reel.ai_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        // User custom category ID
        return reel.category_id === activeFolder;
    }
  });

  const getSystemCounts = () => ({
    all: reels.length,
    inbox: reels.filter(r => r.processing_status === 'pending' || r.processing_status === 'resolving').length,
    uncategorized: reels.filter(r => r.processing_status === 'partially_processed' && !r.category_id).length,
    failed: reels.filter(r => r.is_failed || r.processing_status === 'extraction_failed').length,
    completed: reels.filter(r => r.completion_status === 'completed').length,
    archived: reels.filter(r => r.completion_status === 'archived').length,
  });

  const counts = getSystemCounts();

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 px-2 py-4">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <span className="text-xl font-bold tracking-tight text-white">ReelVault</span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              System Folders
            </div>

            <button
              onClick={() => setActiveFolder('all')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeFolder === 'all' ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="h-4 w-4" />
                <span>All Reels</span>
              </div>
              <span className="text-xs text-zinc-500">{counts.all}</span>
            </button>

            <button
              onClick={() => setActiveFolder('inbox')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeFolder === 'inbox' ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="h-4 w-4" />
                <span>Inbox</span>
              </div>
              <span className="text-xs text-zinc-500">{counts.inbox}</span>
            </button>

            <button
              onClick={() => setActiveFolder('uncategorized')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeFolder === 'uncategorized' ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="h-4 w-4" />
                <span>Uncategorized</span>
              </div>
              <span className="text-xs text-zinc-500">{counts.uncategorized}</span>
            </button>

            <button
              onClick={() => setActiveFolder('failed')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeFolder === 'failed' ? 'bg-red-500/10 text-red-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span>Failed</span>
              </div>
              <span className="text-xs text-red-400 font-semibold">{counts.failed}</span>
            </button>

            <button
              onClick={() => setActiveFolder('completed')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeFolder === 'completed' ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Completed</span>
              </div>
              <span className="text-xs text-zinc-500">{counts.completed}</span>
            </button>

            <button
              onClick={() => setActiveFolder('archived')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeFolder === 'archived' ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className="h-4 w-4" />
                <span>Archived</span>
              </div>
              <span className="text-xs text-zinc-500">{counts.archived}</span>
            </button>
          </div>

          {categories.length > 0 && (
            <div className="mt-8 space-y-1">
              <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Categories
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveFolder(cat.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                    activeFolder === cat.id ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-xs text-zinc-500">
                    {reels.filter(r => r.category_id === cat.id).length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-zinc-800 pt-4">
          <div className="truncate text-xs text-zinc-400 px-2 mb-2 font-mono">
            {session.user.email}
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-red-400 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 px-8 py-4">
          <div className="flex items-center gap-3 w-96">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reels by title, creator, or caption..."
              className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => loadData()}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700/80 active:scale-95 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {filteredReels.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-center">
              <Folder className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No reels found in this view</p>
              <p className="mt-1 text-xs text-zinc-600">
                Share a Reel from your Android phone via ReelVault to see it appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReels.map((reel) => {
                const extractionErr = Array.isArray(reel.extracted_content)
                  ? reel.extracted_content[0]?.extraction_error
                  : reel.extracted_content?.extraction_error;
                const isThisRetrying = retryingId === reel.id || reel.processing_status === 'pending' || reel.processing_status === 'resolving';

                return (
                  <div
                    key={reel.id}
                    className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur hover:border-zinc-700 transition"
                  >
                    <div>
                      {/* Thumbnail or Placeholder */}
                      {reel.thumbnail_url ? (
                        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg bg-zinc-800">
                          <img
                            src={reel.thumbnail_url}
                            alt="Reel thumbnail"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}

                      {/* Header tags & badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
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

                        {reel.difficulty && (
                          <span className="rounded bg-indigo-950/80 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-800/40">
                            {reel.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Title & Creator */}
                      <h3 className="font-semibold text-white leading-tight mb-1 line-clamp-2">
                        {reel.ai_title || (reel.creator_username ? `@${reel.creator_username}'s Reel` : 'Instagram Reel')}
                      </h3>

                      {reel.creator_username && (
                        <p className="text-xs font-mono text-zinc-400 mb-2">@{reel.creator_username}</p>
                      )}

                      {/* Summary / Description / Caption */}
                      <p className="text-xs text-zinc-400 line-clamp-3 mb-3">
                        {reel.ai_summary || reel.ai_description || reel.caption || reel.raw_shared_text || 'No caption available'}
                      </p>

                      {/* Error Banner if in Failed Folder */}
                      {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                        <div className="mb-4 rounded-lg bg-red-950/40 p-2.5 text-xs text-red-300 border border-red-900/40">
                          <p className="font-semibold mb-0.5">Extraction Issue:</p>
                          <p className="font-mono text-[11px] break-all">{extractionErr || 'Unable to retrieve media metadata'}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-zinc-800/80 pt-4 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <a
                          href={reel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                        >
                          <span>Watch on Instagram</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>

                        <span className="text-[11px] text-zinc-500">
                          {new Date(reel.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Retry Button is always accessible on failed reels or as an optional re-extract */}
                        {(reel.is_failed || reel.processing_status === 'extraction_failed' || reel.processing_status === 'partially_processed') && (
                          <button
                            onClick={() => handleRetryExtraction(reel.id)}
                            disabled={isThisRetrying}
                            className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 px-3 text-xs font-medium transition ${
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
                            className="flex-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 py-1.5 text-xs font-medium text-emerald-300 transition"
                          >
                            Mark Done
                          </button>
                        )}
                        {reel.completion_status !== 'archived' && (
                          <button
                            onClick={() => handleStatusChange(reel.id, 'archived')}
                            className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 py-1.5 text-xs font-medium text-zinc-300 transition"
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
    </div>
  );
}
