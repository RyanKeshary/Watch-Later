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
  AlertTriangle,
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
  Sliders,
  Palette,
  Download,
  Smartphone,
  X,
  Play,
  Eye,
  EyeOff,
  Bell,
  PieChart,
  Activity,
  Layers,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Edit2,
  BookmarkCheck,
  Compass,
  Star,
  Sparkles,
  BookOpen
} from 'lucide-react';

type NavPage = 'home' | 'all' | 'categories' | 'watched' | 'inbox' | 'failed' | 'archived' | 'settings';
type PostTypeFilter = 'all' | 'reels' | 'posts' | 'carousels';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active navigation page
  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [postTypeFilter, setPostTypeFilter] = useState<PostTypeFilter>('all');

  // Real-time toast arrival banner on dashboard
  const [incomingAlert, setIncomingAlert] = useState<string | null>(null);

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

  // Category Lightbox Modal (interactive folder view with drill-down)
  const [categoryLightbox, setCategoryLightbox] = useState<Category | null>(null);

  // UI customization states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);

  // Settings & Preferences
  const [maxGenerations, setMaxGenerations] = useState(3);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showPersonaInsights, setShowPersonaInsights] = useState(true);
  const [retentionPeriod, setRetentionPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Category creation & customization
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryInsertPending, setCategoryInsertPending] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryIcon, setEditCategoryIcon] = useState('Folder');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');
  const [categoryMetaMap, setCategoryMetaMap] = useState<Record<string, { icon?: string; description?: string }>>({});
  const [metaLoaded, setMetaLoaded] = useState(false);

  // Sync category metadata to localStorage whenever state updates after initial load
  useEffect(() => {
    if (!metaLoaded) return;
    try {
      localStorage.setItem('watchlater_category_meta', JSON.stringify(categoryMetaMap));
    } catch (e) {
      console.warn('Failed to sync category metadata:', e);
    }
  }, [categoryMetaMap, metaLoaded]);

  // Clear history lightbox
  const [showClearHistoryLightbox, setShowClearHistoryLightbox] = useState(false);
  const [clearCategoriesAlso, setClearCategoriesAlso] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedPins = localStorage.getItem('watchlater_pinned_folders');
      if (savedPins) setPinnedFolderIds(JSON.parse(savedPins));

      const savedMaxGen = localStorage.getItem('watchlater_max_generations');
      if (savedMaxGen) setMaxGenerations(parseInt(savedMaxGen, 10));

      const savedDensity = localStorage.getItem('watchlater_density');
      if (savedDensity) setDensity(savedDensity as any);

      const savedLayout = localStorage.getItem('watchlater_view_layout');
      if (savedLayout) setViewLayout(savedLayout as any);

      const savedThumbs = localStorage.getItem('watchlater_show_thumbnails');
      if (savedThumbs !== null) setShowThumbnails(savedThumbs === 'true');

      const savedPersona = localStorage.getItem('watchlater_show_persona');
      if (savedPersona !== null) setShowPersonaInsights(savedPersona === 'true');

      const savedSidebar = localStorage.getItem('watchlater_sidebar_collapsed');
      if (savedSidebar !== null) setSidebarCollapsed(savedSidebar === 'true');

      const savedRetention = localStorage.getItem('watchlater_archive_retention') as any;
      if (savedRetention) setRetentionPeriod(savedRetention);

      const savedCatMeta = localStorage.getItem('watchlater_category_meta');
      if (savedCatMeta) setCategoryMetaMap(JSON.parse(savedCatMeta));
    } catch (e) { } finally {
      setMetaLoaded(true);
    }
  }, []);

  // Category state reconciliation
  useEffect(() => {
    if (selectedCategoryId && !categories.some(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
    if (categoryLightbox && !categories.some(c => c.id === categoryLightbox.id)) {
      setCategoryLightbox(null);
    }
  }, [categories, selectedCategoryId, categoryLightbox]);

  const togglePin = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedFolderIds(prev => {
      const next = prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId];
      try {
        localStorage.setItem('watchlater_pinned_folders', JSON.stringify(next));
      } catch (err) { }
      return next;
    });
  };

  const updateViewLayout = (val: 'grid' | 'list') => {
    setViewLayout(val);
    try {
      localStorage.setItem('watchlater_view_layout', val);
    } catch (err) { }
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

  // Real-time synchronization & new reel alert banner
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
              // Show instantaneous banner notification on dashboard
              setIncomingAlert(newReel.url);
              setTimeout(() => setIncomingAlert(null), 5000);
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Reel;
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
        ? 30 * msPerDay
        : 7 * msPerDay;

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

  const persistCategoryMeta = (updatedMap: Record<string, { icon?: string; description?: string }>) => {
    try {
      localStorage.setItem('watchlater_category_meta', JSON.stringify(updatedMap));
    } catch (e) {
      console.warn('Failed to persist category metadata:', e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryInsertPending) return;

    const trimmed = newCategoryName.trim();
    if (!trimmed || !session?.user?.id) return;

    // Prevent duplicate category creation locally
    const existing = categories.find(
      c => c.name.trim().toLowerCase() === trimmed.toLowerCase() &&
        (categoryParentId ? c.parent_id === categoryParentId : !c.parent_id)
    );
    if (existing) {
      alert('A category with this name already exists at this level.');
      return;
    }

    setCategoryInsertPending(true);
    try {
      // Re-check database to prevent race conditions across tabs/clients with literal escaped pattern
      const escapedName = trimmed.replace(/[%_\\]/g, '\\$&');
      let query = supabase
        .from('categories')
        .select('id')
        .eq('user_id', session.user.id)
        .ilike('name', escapedName)
        .limit(1);

      if (categoryParentId) {
        query = query.eq('parent_id', categoryParentId);
      } else {
        query = query.is('parent_id', null);
      }

      const { data: remoteExisting, error: lookupError } = await query.maybeSingle();
      if (lookupError) {
        alert(`Failed to verify category uniqueness: ${lookupError.message}`);
        setCategoryInsertPending(false);
        return;
      }

      if (remoteExisting) {
        alert('A category with this name already exists at this level.');
        setCategoryInsertPending(false);
        return;
      }

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
        setCategories(prev => {
          if (prev.some(c => c.id === data.id)) return prev;
          return [...prev, data as Category];
        });
        // Auto-assign default description & icon identity deriving from latest state
        const meta = {
          icon: categoryParentId ? 'Tag' : 'Folder',
          description: categoryParentId ? `Sub-niche under parent category` : `Curated collection for ${trimmed}`
        };
        setCategoryMetaMap(prev => ({ ...prev, [data.id]: meta }));

        setNewCategoryName('');
        setIsCreatingCategory(false);
        setCategoryParentId(null);
      }
    } catch (err: any) {
      alert(`Error creating category: ${err.message || err}`);
    } finally {
      setCategoryInsertPending(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;
    const newName = editCategoryName.trim();

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', editingCategory.id);

      if (error) throw error;

      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: newName } : c));

      // Derive update from latest state
      const targetId = editingCategory.id;
      setCategoryMetaMap(prev => ({
        ...prev,
        [targetId]: {
          icon: editCategoryIcon,
          description: editCategoryDesc.trim() || prev[targetId]?.description || `Curated collection for ${newName}`
        }
      }));

      setEditingCategory(null);
    } catch (err: any) {
      alert(`Error updating category: ${err.message || err}`);
    }
  };

  const handleDeleteCategory = async (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this category? Subcategories will also be deleted.')) return;

    const childCatIds = categories.filter(c => c.parent_id === catId).map(c => c.id);
    const allDeletedIds = new Set([catId, ...childCatIds]);

    setCategories(prev => prev.filter(c => !allDeletedIds.has(c.id)));
    setPinnedFolderIds(prev => prev.filter(id => !allDeletedIds.has(id)));

    try {
      const { error } = await supabase.from('categories').delete().eq('id', catId);
      if (error) {
        alert(`Failed to delete category: ${error.message}`);
        await loadData();
      } else {
        // Remove from metadata only after database delete succeeds
        setCategoryMetaMap(prev => {
          const updated = { ...prev };
          Array.from(allDeletedIds).forEach(id => {
            delete updated[id];
          });
          return updated;
        });
      }
    } catch (err: any) {
      alert(`Error deleting category: ${err.message || err}`);
      await loadData();
    }
  };

  const exportData = () => {
    const headers = ['id', 'url', 'ai_title', 'creator_username', 'completion_status', 'created_at'];
    const sanitizeCell = (val: string | null | undefined) => {
      let text = val ? String(val) : '';
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = reels.map(r => [
      sanitizeCell(r.id),
      sanitizeCell(r.url),
      sanitizeCell(r.ai_title),
      sanitizeCell(r.creator_username),
      sanitizeCell(r.completion_status),
      sanitizeCell(r.created_at)
    ]);

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `watchlater_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg(error.message);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
    if (signOutError) {
      setPasswordMsg(`Password changed, but global sign out encountered an issue: ${signOutError.message}`);
    } else {
      alert('Password updated successfully! You have been logged out from all sessions. Please log in again with your new password.');
      setNewPassword('');
      setSession(null);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Remove this device registration?')) return;
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    const { error } = await supabase.from('devices').delete().eq('id', deviceId);
    if (error) {
      alert(`Failed to remove device: ${error.message}`);
      await loadData();
    }
  };

  // Filtered reels according to active page, search query, and post type filter
  const displayedReels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return reels.filter((reel) => {
      // Dynamic Search
      if (q) {
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

      // Post Type Filter
      if (postTypeFilter !== 'all') {
        const isReel = reel.url.includes('/reel/') || reel.url.includes('/reels/');
        const isCarousel = reel.caption?.toLowerCase().includes('carousel') || (reel.raw_shared_text?.includes('CAROUSEL'));
        if (postTypeFilter === 'reels' && !isReel) return false;
        if (postTypeFilter === 'carousels' && !isCarousel) return false;
        if (postTypeFilter === 'posts' && (isReel || isCarousel)) return false;
      }

      // Page Filters
      switch (currentPage) {
        case 'all':
          return reel.completion_status !== 'archived';
        case 'watched':
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
  }, [reels, currentPage, selectedCategoryId, searchQuery, postTypeFilter]);

  // Persona insights (requires at least 20 items to unlock, updates every 100 saves)
  const userPersonaInsight = useMemo(() => {
    if (reels.length < 20) {
      return `You have saved ${reels.length}/20 items. Save at least 20 items to unlock persona insights.`;
    }

    // Bucket into milestones of 100 reels (20-99: initial sample, 100+: analyzed per 100 saves)
    const milestoneCount = reels.length >= 100 ? Math.floor(reels.length / 100) * 100 : reels.length;
    const sampledReels = reels.slice(0, milestoneCount);

    const counts: Record<string, number> = {};
    let categorizedCount = 0;
    for (const r of sampledReels) {
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
    const milestoneLabel = reels.length >= 100 ? ` (Evaluated across your first ${milestoneCount} saves, refreshed every 100 items)` : '';
    if (top) {
      return `You are intensely drawn to ${top[0]}${top2 ? ` and ${top2[0]}` : ''}. You curate high-value knowledge and trending media with laser focus.${milestoneLabel}`;
    }
    return 'Your vault captures a diverse set of topics with active curiosity.';
  }, [reels, categories]);

  const rootCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const renderCategoryIcon = (iconName?: string, className: string = 'h-10 w-10 text-indigo-400') => {
    switch (iconName) {
      case 'Star': return <Star className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Bookmark': return <Bookmark className={className} />;
      case 'BookmarkCheck': return <BookmarkCheck className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Tag': return <Tag className={className} />;
      default: return <Folder className={className} />;
    }
  };

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
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mb-3">
              <Bookmark className="h-7 w-7 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Watch Later</h1>
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
              <div className="relative mt-1">
                <input
                  type={showAuthPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 pr-10 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowAuthPassword(!showAuthPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition"
                >
                  {showAuthPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
      {/* Toast Alert for Incoming Reels */}
      {incomingAlert && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-indigo-500/40 bg-zinc-900/90 p-4 shadow-2xl backdrop-blur animate-in slide-in-from-top-2">
          <Bell className="h-5 w-5 text-indigo-400 animate-bounce" />
          <div>
            <p className="text-xs font-semibold text-white">New Content Captured!</p>
            <p className="text-[11px] text-zinc-400 truncate max-w-xs">{incomingAlert}</p>
          </div>
          <button onClick={() => setIncomingAlert(null)} className="text-zinc-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'
          } transition-all duration-200 border-r border-zinc-800 bg-zinc-900/40 p-3 flex flex-col justify-between select-none`}
      >
        <div className="overflow-y-auto overflow-x-hidden">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between px-2 py-3 mb-2">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-indigo-400" />
                <span className="text-lg font-bold tracking-tight text-white">Watch Later</span>
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

          {/* Navigation Items */}
          <div className="space-y-1">
            <button
              onClick={() => { setCurrentPage('home'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'home' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              title="Home (Stats & Insights)"
            >
              <Home className="h-4 w-4 shrink-0 text-indigo-400" />
              {!sidebarCollapsed && <span>Home</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('all'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'all' && !selectedCategoryId ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              title="All Content"
            >
              <div className="flex items-center gap-2.5">
                <Film className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>All Content</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.all}</span>}
            </button>

            {/* Renamed from Sorted Saves to Categories */}
            <button
              onClick={() => { setCurrentPage('categories'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'categories' && !selectedCategoryId ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              title="Categories"
            >
              <div className="flex items-center gap-2.5">
                <FolderTree className="h-4 w-4 shrink-0 text-indigo-400" />
                {!sidebarCollapsed && <span>Categories</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.categories}</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('watched'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'watched' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              title="Watched"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                {!sidebarCollapsed && <span>Watched</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[11px] text-zinc-500">{counts.watched}</span>}
            </button>

            <button
              onClick={() => { setCurrentPage('inbox'); setSelectedCategoryId(null); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'inbox' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
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
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'failed' ? 'bg-red-500/15 text-red-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
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
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'archived' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
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

          {/* Pinned Folders */}
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
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition group ${currentPage === 'categories' && selectedCategoryId === cat.id ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
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

        {/* Footer */}
        <div className="border-t border-zinc-800/80 pt-3 mt-2 space-y-1">
          <button
            onClick={() => setCurrentPage('settings')}
            className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${currentPage === 'settings' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
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
        <header className="flex flex-wrap items-center justify-between border-b border-zinc-800 px-6 py-3 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-base font-semibold text-white tracking-tight">
              {currentPage === 'home' && 'Analytics & Intelligence'}
              {currentPage === 'all' && 'All Saved Content'}
              {currentPage === 'categories' && (selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || 'Category' : 'Categories Directory')}
              {currentPage === 'watched' && 'Watched Collection'}
              {currentPage === 'inbox' && 'Processing Inbox'}
              {currentPage === 'failed' && 'Extraction Issues'}
              {currentPage === 'archived' && 'Archived Content'}
              {currentPage === 'settings' && 'Settings'}
            </h2>

            {/* Dynamic, Reactive Search Bar */}
            {currentPage !== 'home' && currentPage !== 'settings' && !(currentPage === 'categories' && !selectedCategoryId) && (
              <div className="flex items-center gap-2 w-80 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 focus-within:border-indigo-500/80 transition">
                <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Instant search by title, summary, or user..."
                  className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white text-xs">✕</button>
                )}
              </div>
            )}

            {/* Post Type Filters (Reels vs Posts vs Carousels) */}
            {currentPage !== 'home' && currentPage !== 'settings' && (currentPage !== 'categories' || selectedCategoryId) && (
              <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
                <button
                  onClick={() => setPostTypeFilter('all')}
                  className={`px-2 py-1 rounded transition ${postTypeFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setPostTypeFilter('reels')}
                  className={`px-2 py-1 rounded transition ${postTypeFilter === 'reels' ? 'bg-indigo-600 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
                >
                  Reels
                </button>
                <button
                  onClick={() => setPostTypeFilter('carousels')}
                  className={`px-2 py-1 rounded transition ${postTypeFilter === 'carousels' ? 'bg-indigo-600 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
                >
                  Carousels
                </button>
                <button
                  onClick={() => setPostTypeFilter('posts')}
                  className={`px-2 py-1 rounded transition ${postTypeFilter === 'posts' ? 'bg-indigo-600 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
                >
                  Posts
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Layout Toggle */}
            {currentPage !== 'home' && currentPage !== 'settings' && (currentPage !== 'categories' || selectedCategoryId) && (
              <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                <button
                  onClick={() => updateViewLayout('grid')}
                  className={`p-1.5 rounded transition ${viewLayout === 'grid' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => updateViewLayout('list')}
                  className={`p-1.5 rounded transition ${viewLayout === 'list' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  title="List View"
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

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

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* HOME VIEW: STATS & NICHE DISTRIBUTION */}
          {currentPage === 'home' && (
            <div className="space-y-6 max-w-6xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-500 block mb-1">Total Saved Posts</span>
                  <div className="text-2xl font-bold text-white">{reels.length}</div>
                  <span className="text-[11px] text-indigo-400 mt-1 block">
                    {counts.watched} completed ({reels.length > 0 ? Math.round((counts.watched / reels.length) * 100) : 0}%)
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-500 block mb-1">Total Categories &amp; Subfolders</span>
                  <div className="text-2xl font-bold text-white">{categories.length}</div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    {rootCategories.length} primary, {categories.length - rootCategories.length} sub-niches
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-500 block mb-1">Connected Phone</span>
                  <div className="text-2xl font-bold text-white">{devices.length}</div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    {devices.length > 0 ? (devices[0]?.device_name || 'Active Android') : 'No devices yet'}
                  </span>
                </div>
              </div>

              {/* Persona Insights */}
              {showPersonaInsights && (
                <div className="rounded-xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/40 to-zinc-900/60 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-5 w-5 text-indigo-400" />
                      <h3 className="text-sm font-semibold text-white">What Your Saves Say About You</h3>
                    </div>
                    {reels.length < 20 && (
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/60">
                        {reels.length} / 20 Saved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {userPersonaInsight}
                  </p>
                </div>
              )}

              {/* Niche Category Distribution */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-indigo-400" />
                  <span>Niche Category Breakdown</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rootCategories.map(cat => {
                    const count = reels.filter(r => r.category_id === cat.id).length;
                    const pct = reels.length > 0 ? Math.round((count / reels.length) * 100) : 0;
                    return (
                      <div key={cat.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40">
                        <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                          <span className="font-semibold">{cat.name}</span>
                          <span className="text-zinc-500">{count} posts ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES DIRECTORY: INTERACTIVE FOLDER TILES */}
          {currentPage === 'categories' && !selectedCategoryId && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Categories Directory</h3>
                  <p className="text-xs text-zinc-400">Click any folder icon to inspect subcategories or view saved posts.</p>
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

              {/* Folder-Type Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {rootCategories.map(cat => {
                  const subcats = getSubcategories(cat.id);
                  const count = reels.filter(r => r.category_id === cat.id).length;
                  const isPinned = pinnedFolderIds.includes(cat.id);

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setCategoryLightbox(cat)}
                      className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850 hover:border-indigo-500/50 cursor-pointer transition text-center"
                    >
                      {/* Top Action Buttons (Pin, Edit & Delete) */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                            setEditCategoryName(cat.name);
                            setEditCategoryIcon(categoryMetaMap[cat.id]?.icon || 'Folder');
                            setEditCategoryDesc(categoryMetaMap[cat.id]?.description || '');
                          }}
                          title="Edit name, icon & description"
                          className="p-1 rounded-md text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800 text-xs transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => togglePin(cat.id, e)}
                          title={isPinned ? 'Unpin category' : 'Pin category'}
                          className={`p-1 rounded-md text-xs transition ${isPinned ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800'}`}
                        >
                          <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCategory(cat.id, e)}
                          title="Delete category"
                          className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 text-xs transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="relative mb-2">
                        {renderCategoryIcon(categoryMetaMap[cat.id]?.icon, "h-12 w-12 text-indigo-400 group-hover:scale-105 transition")}
                        {subcats.length > 0 && (
                          <span className="absolute -bottom-1 -right-1 bg-zinc-800 text-[9px] font-mono text-zinc-300 rounded px-1 border border-zinc-700">
                            +{subcats.length}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate w-full mb-0.5">
                        {cat.name}
                      </span>
                      {categoryMetaMap[cat.id]?.description && (
                        <span className="text-[10px] text-zinc-400 line-clamp-1 w-full mb-1">
                          {categoryMetaMap[cat.id]?.description}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {count} items
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REELS GRID / LIST VIEW */}
          {(currentPage !== 'home' && currentPage !== 'settings' && (currentPage !== 'categories' || selectedCategoryId)) && (
            <div>
              {/* Warning Notice in Archived Folder */}
              {currentPage === 'archived' && (
                <div className="mb-4 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 flex items-center gap-2.5 text-xs text-amber-300">
                  <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Automatic Deletion Notice:</strong> Posts stored in the Archived folder are permanently purged based on your retention preference ({retentionPeriod === 'day' ? '1 day' : retentionPeriod === 'week' ? '1 week' : '1 month cap'}).
                  </span>
                </div>
              )}

              {/* Live Incoming Queue & Processing Banner for Inbox */}
              {selectedCategoryId && (
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    ← Back to Categories
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
                  <p className="text-xs font-medium text-zinc-400">No content found in this view</p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Share a Reel from your phone to Watch Later to see it appear here.
                  </p>
                </div>
              ) : viewLayout === 'grid' ? (
                <div className={
                  density === 'compact'
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5"
                    : density === 'spacious'
                      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
                }>
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
                        className={`flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 ${density === 'compact' ? 'p-3' : density === 'spacious' ? 'p-5' : 'p-4'
                          } backdrop-blur hover:border-zinc-700 cursor-pointer transition`}
                      >
                        <div>
                          {/* Thumbnail with direct Play / Redirect action */}
                          {showThumbnails && reel.thumbnail_url ? (
                            <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-zinc-800 group/thumb">
                              <img
                                src={reel.thumbnail_url}
                                alt="Thumbnail"
                                className="h-full w-full object-cover group-hover/thumb:scale-105 transition"
                              />
                              <a
                                href={reel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition"
                                title="Play Reel on Instagram (New Tab)"
                              >
                                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                  <Play className="h-4 w-4 fill-white ml-0.5" />
                                </div>
                              </a>
                            </div>
                          ) : null}

                          {/* Header badges */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${reel.is_failed || reel.processing_status === 'extraction_failed'
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

                          {/* Title & Creator */}
                          <h3 className="font-semibold text-white leading-tight text-sm mb-1 line-clamp-2">
                            {reel.ai_title || (reel.creator_username ? `@${reel.creator_username}'s Post` : 'Instagram Post')}
                          </h3>

                          {reel.creator_username && (
                            <p className="text-[11px] font-mono text-zinc-400 mb-2">@{reel.creator_username}</p>
                          )}

                          {/* AI Summary */}
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
                              <Play className="h-3 w-3 fill-indigo-400" />
                              <span>Play on Instagram</span>
                              <ExternalLink className="h-2.5 w-2.5" />
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
              ) : (
                /* Dedicated List View */
                <div className="space-y-2.5">
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
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 ${density === 'compact' ? 'p-2.5 sm:py-2 sm:px-3' : density === 'spacious' ? 'p-4' : 'p-3'
                          } backdrop-blur hover:border-zinc-700 cursor-pointer transition`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {showThumbnails && reel.thumbnail_url && (
                            <div className="relative h-16 w-16 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800 group/thumb">
                              <img
                                src={reel.thumbnail_url}
                                alt="Thumbnail"
                                className="h-full w-full object-cover group-hover/thumb:scale-105 transition"
                              />
                              <a
                                href={reel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition"
                                title="Play Reel"
                              >
                                <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                              </a>
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${reel.is_failed || reel.processing_status === 'extraction_failed'
                                    ? 'bg-red-950/80 text-red-400 border border-red-800/50'
                                    : reel.processing_status === 'processed'
                                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}
                              >
                                {reel.processing_status}
                              </span>

                              {catObj && (
                                <span className="rounded bg-indigo-950/60 px-1.5 py-0.5 text-[8px] font-medium text-indigo-300 border border-indigo-800/40 truncate">
                                  {catObj.name}{subObj ? ` / ${subObj.name}` : ''}
                                </span>
                              )}

                              {reel.creator_username && (
                                <span className="text-[10px] font-mono text-zinc-400 truncate">@{reel.creator_username}</span>
                              )}
                            </div>

                            <h3 className="font-semibold text-white leading-tight text-xs sm:text-sm truncate">
                              {reel.ai_title || (reel.creator_username ? `@${reel.creator_username}'s Post` : 'Instagram Post')}
                            </h3>

                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {reel.ai_summary || reel.ai_description || reel.caption || 'No summary available'}
                            </p>
                          </div>
                        </div>

                        {/* List Row Right Controls */}
                        <div
                          className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={reel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                            title="Open on Instagram"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                            <button
                              onClick={() => handleRetryExtraction(reel.id)}
                              disabled={isThisRetrying}
                              className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-200"
                            >
                              <RotateCcw className={`h-3 w-3 ${isThisRetrying ? 'animate-spin text-indigo-400' : ''}`} />
                              <span>Retry</span>
                            </button>
                          )}

                          {reel.completion_status !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(reel.id, 'completed')}
                              className="rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-300 transition"
                            >
                              Watched
                            </button>
                          )}

                          {reel.completion_status !== 'archived' && (
                            <button
                              onClick={() => handleStatusChange(reel.id, 'archived')}
                              className="rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 transition"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS VIEW */}
          {currentPage === 'settings' && (
            <div className="max-w-4xl space-y-8">
              {/* Account Settings with Password Preview */}
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
                      <div className="relative flex-1">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="New password (min 6 chars)..."
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 pr-9 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-2 text-zinc-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">
                        Update
                      </button>
                    </div>
                    {passwordMsg && <p className="text-xs text-indigo-400 mt-1">{passwordMsg}</p>}
                  </form>
                </div>
              </div>

              {/* Appearance & Density */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-400" />
                  <span>2. Appearance &amp; Density</span>
                </h3>

                <div className="space-y-4 max-w-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-300 block">Card Density</span>
                      <span className="text-[11px] text-zinc-500">Adjust padding and grid columns</span>
                    </div>
                    <select
                      value={density}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setDensity(val);
                        localStorage.setItem('watchlater_density', val);
                      }}
                      className="bg-zinc-800 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200"
                    >
                      <option value="compact">Compact (Dense / More items)</option>
                      <option value="comfortable">Comfortable (Balanced)</option>
                      <option value="spacious">Spacious (Large cards)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-300 block">Display Thumbnails</span>
                      <span className="text-[11px] text-zinc-500">Show reel cover pictures on cards</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showThumbnails}
                      onChange={(e) => {
                        setShowThumbnails(e.target.checked);
                        localStorage.setItem('watchlater_show_thumbnails', String(e.target.checked));
                      }}
                      className="rounded accent-indigo-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="show-persona-insights" className="text-xs text-zinc-300 block cursor-pointer">Show Persona Insights</label>
                      <span className="text-[11px] text-zinc-500">Display &quot;What Your Saves Say About You&quot; panel</span>
                    </div>
                    <input
                      id="show-persona-insights"
                      aria-label="Show Persona Insights"
                      type="checkbox"
                      checked={showPersonaInsights}
                      onChange={(e) => {
                        setShowPersonaInsights(e.target.checked);
                        localStorage.setItem('watchlater_show_persona', String(e.target.checked));
                      }}
                      className="rounded accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-300 block">Sidebar Collapsed by Default</span>
                      <span className="text-[11px] text-zinc-500">Keep navigation sidebar minimized</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={sidebarCollapsed}
                      onChange={(e) => {
                        setSidebarCollapsed(e.target.checked);
                        localStorage.setItem('watchlater_sidebar_collapsed', String(e.target.checked));
                      }}
                      className="rounded accent-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Archive Auto-Delete */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>3. Archive Auto-Delete &amp; Retention Cap</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-3">
                  Archiving a post marks it for automatic deletion after your chosen retention period. Cap is 1 month.
                </p>

                <div className="grid grid-cols-3 gap-2 max-w-md bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => {
                      setRetentionPeriod('day');
                      localStorage.setItem('watchlater_archive_retention', 'day');
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${retentionPeriod === 'day' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    1 Day
                  </button>
                  <button
                    onClick={() => {
                      setRetentionPeriod('week');
                      localStorage.setItem('watchlater_archive_retention', 'week');
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${retentionPeriod === 'week' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    1 Week
                  </button>
                  <button
                    onClick={() => {
                      setRetentionPeriod('month');
                      localStorage.setItem('watchlater_archive_retention', 'month');
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${retentionPeriod === 'month' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    1 Month (Cap)
                  </button>
                </div>
              </div>

              {/* Data Management & Export */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Download className="h-4 w-4 text-indigo-400" />
                  <span>4. Data Management &amp; Export</span>
                </h3>

                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">
                    Export your curated library or clean completed items.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => exportData()}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV ({reels.length} items)</span>
                    </button>
                    <button
                      onClick={() => {
                        setClearCategoriesAlso(false);
                        setShowClearHistoryLightbox(true);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 hover:bg-red-950/40 hover:border-red-800/60 text-red-300 px-3 py-1.5 text-xs font-medium transition"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      <span>Delete All Saved Items</span>
                    </button>
                    <button
                      onClick={async () => {
                        const completedReels = reels.filter(r => r.completion_status === 'completed');
                        if (completedReels.length === 0) {
                          alert('No completed items to delete.');
                          return;
                        }
                        if (!confirm(`Permanently delete ${completedReels.length} completed item(s)?`)) return;
                        const ids = completedReels.map(r => r.id);
                        setReels(prev => prev.filter(r => r.completion_status !== 'completed'));
                        const { error } = await supabase.from('reels').delete().in('id', ids);
                        if (error) {
                          alert(`Failed: ${error.message}`);
                          await loadData();
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-red-950/40 hover:border-red-800/50 hover:text-red-400 px-3 py-1.5 text-xs font-medium text-zinc-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Watched Content</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Registered Devices */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-indigo-400" />
                  <span>5. Registered Devices &amp; Synchronization</span>
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
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* REEL DETAIL PANEL / LIGHTBOX */}
      {detailReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2 truncate">
                <Film className="h-5 w-5 text-indigo-400 shrink-0" />
                <h3 className="text-base font-bold text-white truncate">
                  {detailReel.ai_title || 'Post Details'}
                </h3>
              </div>
              <button
                onClick={() => setDetailReelId(null)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {detailReel.thumbnail_url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-800 border border-zinc-700/50 group/preview">
                    <img
                      src={detailReel.thumbnail_url}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                    <a
                      href={detailReel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/preview:opacity-100 transition"
                      title="Play Reel on Instagram"
                    >
                      <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Play className="h-5 w-5 fill-white ml-0.5" />
                      </div>
                    </a>
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
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">Saved On</span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {new Date(detailReel.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {detailReel.ai_summary && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-semibold text-indigo-400 block mb-1">Summary</span>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {detailReel.ai_summary}
                  </p>
                </div>
              )}

              {detailReel.ai_description && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">Description</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {detailReel.ai_description}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">Full Caption</span>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {detailReel.caption || detailReel.raw_shared_text || 'No caption found'}
                </p>
              </div>

              {/* Play Link opens on new tab */}
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
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Play Reel</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

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
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY EXPLORER LIGHTBOX (FOLDER-TYPE DRILL-DOWN) */}
      {categoryLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">{categoryLightbox.name}</h3>
                <span className="text-xs text-zinc-400 font-mono">
                  ({reels.filter(r => r.category_id === categoryLightbox.id || r.subcategory_id === categoryLightbox.id).length} items)
                </span>
              </div>
              <button
                onClick={() => setCategoryLightbox(null)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Direct View Posts Button */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-300">View all reels in this folder:</span>
                <button
                  onClick={() => {
                    setSelectedCategoryId(categoryLightbox.id);
                    setCategoryLightbox(null);
                  }}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-xs font-medium text-white transition"
                >
                  Open {categoryLightbox.name} Posts →
                </button>
              </div>

              {/* Subcategory Folders */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Sub-Folders &amp; Niches
                  </span>
                  <button
                    onClick={() => {
                      setCategoryParentId(categoryLightbox.id);
                      setIsCreatingCategory(true);
                      setCategoryLightbox(null);
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Sub-Folder</span>
                  </button>
                </div>
                {getSubcategories(categoryLightbox.id).length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No nested sub-folders.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getSubcategories(categoryLightbox.id).map(sub => {
                      const count = reels.filter(r => r.subcategory_id === sub.id).length;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setSelectedCategoryId(sub.id);
                            setCategoryLightbox(null);
                          }}
                          className="group/sub relative flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-indigo-500/50 hover:bg-zinc-850 cursor-pointer transition text-center"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryLightbox(null);
                              setEditingCategory(sub);
                              setEditCategoryName(sub.name);
                              setEditCategoryIcon(categoryMetaMap[sub.id]?.icon || 'Tag');
                              setEditCategoryDesc(categoryMetaMap[sub.id]?.description || '');
                            }}
                            className="absolute top-1.5 right-1.5 p-1 text-zinc-500 hover:text-indigo-300 opacity-0 group-hover/sub:opacity-100 transition rounded"
                            title="Edit Subcategory"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          {renderCategoryIcon(categoryMetaMap[sub.id]?.icon || 'Tag', "h-8 w-8 text-indigo-400 mb-1")}
                          <span className="text-xs font-medium text-white truncate w-full">{sub.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{count} posts</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Saved Items Lightbox */}
      {showClearHistoryLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => !isClearingHistory && setShowClearHistoryLightbox(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Delete All Saved Items</h3>
                <p className="text-xs text-zinc-400">Permanently delete saved items from your account.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will permanently remove all {reels.length} saved item(s) from Watch Later. This action cannot be undone.
            </p>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 flex items-start gap-3">
              <input
                id="clear-categories-check"
                type="checkbox"
                checked={clearCategoriesAlso}
                onChange={e => setClearCategoriesAlso(e.target.checked)}
                className="mt-0.5 rounded accent-red-600 cursor-pointer"
              />
              <label htmlFor="clear-categories-check" className="text-xs text-zinc-300 cursor-pointer select-none">
                <span className="font-medium text-white block">Also clear all categories &amp; sub-folders</span>
                <span className="text-[11px] text-zinc-500">
                  Delete all {categories.length} category folder(s) alongside saved posts.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={isClearingHistory}
                onClick={() => setShowClearHistoryLightbox(false)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isClearingHistory}
                onClick={async () => {
                  const userId = session?.user?.id;
                  if (!userId) {
                    alert('You must be logged in to delete items.');
                    return;
                  }
                  setIsClearingHistory(true);
                  try {
                    const { error: reelsErr } = await supabase
                      .from('reels')
                      .delete()
                      .eq('user_id', userId);
                    if (reelsErr) throw reelsErr;

                    if (clearCategoriesAlso) {
                      const { error: catErr } = await supabase
                        .from('categories')
                        .delete()
                        .eq('user_id', userId);
                      if (catErr) throw catErr;
                      setCategories([]);
                      setSelectedCategoryId(null);
                    }

                    setReels([]);
                    setShowClearHistoryLightbox(false);
                    await loadData();
                  } catch (err: any) {
                    alert(`Failed to delete items: ${err.message || err}`);
                    await loadData();
                  } finally {
                    setIsClearingHistory(false);
                  }
                }}
                className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {isClearingHistory ? 'Deleting...' : 'Delete All Saved Items'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Category Lightbox */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setEditingCategory(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Customize Category</h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editCategoryName}
                  onChange={e => setEditCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white"
                  placeholder="e.g. Cooking, Tech, Workouts"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Icon Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Folder', icon: 'Folder' },
                    { label: 'Star', icon: 'Star' },
                    { label: 'Sparkles', icon: 'Sparkles' },
                    { label: 'Bookmark', icon: 'Bookmark' },
                    { label: 'Check', icon: 'BookmarkCheck' },
                    { label: 'Compass', icon: 'Compass' },
                    { label: 'Book', icon: 'BookOpen' },
                    { label: 'Tag', icon: 'Tag' }
                  ].map(item => (
                    <button
                      key={item.icon}
                      type="button"
                      onClick={() => setEditCategoryIcon(item.icon)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition ${editCategoryIcon === item.icon
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-800'
                        }`}
                    >
                      {renderCategoryIcon(item.icon, "h-5 w-5 mb-1")}
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Description / Topic Identity</label>
                <textarea
                  rows={2}
                  value={editCategoryDesc}
                  onChange={e => setEditCategoryDesc(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white resize-none"
                  placeholder="What is saved in this folder (e.g. Italian pasta recipes, quick dinners)?"
                />
                <span className="text-[10px] text-zinc-500">
                  This description preserves the category&apos;s purpose so content continues organizing here cleanly.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
