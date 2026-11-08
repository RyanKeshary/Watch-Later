'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Reel, Category, Device } from '@/types/database';
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

type NavPage = 'home' | 'all' | 'categories' | 'savelater' | 'watched' | 'inbox' | 'failed' | 'archived' | 'settings';
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
  const incomingAlertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showIncomingAlert = useCallback((msg: string) => {
    if (incomingAlertTimerRef.current) {
      clearTimeout(incomingAlertTimerRef.current);
    }
    setIncomingAlert(msg);
    incomingAlertTimerRef.current = setTimeout(() => {
      setIncomingAlert(null);
      incomingAlertTimerRef.current = null;
    }, 5000);
  }, []);

  const clearIncomingAlert = useCallback(() => {
    if (incomingAlertTimerRef.current) {
      clearTimeout(incomingAlertTimerRef.current);
      incomingAlertTimerRef.current = null;
    }
    setIncomingAlert(null);
  }, []);

  useEffect(() => {
    return () => {
      if (incomingAlertTimerRef.current) clearTimeout(incomingAlertTimerRef.current);
    };
  }, []);

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);
  const [savedLaterIds, setSavedLaterIds] = useState<string[]>([]);
  const reelsRef = useRef<Reel[]>([]);
  const savedLaterIdsRef = useRef<string[]>([]);
  const sessionRef = useRef<any>(session);
  useEffect(() => { reelsRef.current = reels; }, [reels]);
  useEffect(() => { savedLaterIdsRef.current = savedLaterIds; }, [savedLaterIds]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
  const [editCategoryColor, setEditCategoryColor] = useState('default');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');
  const [categoryMetaMap, setCategoryMetaMap] = useState<Record<string, { icon?: string; color?: string; description?: string }>>({});
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [isFirstTimePersona, setIsFirstTimePersona] = useState(false);
  const [showGameGuide, setShowGameGuide] = useState(false);
  const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);

  // Drag and drop state for reels and folders
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: 'reel' | 'folder'; id: string; reelId?: string; folderId?: string } | null>(null);

  const handleDropOnCategory = async (targetCatId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCatId(null);

    let data: { type: 'reel' | 'folder'; id?: string; reelId?: string; folderId?: string } | null = null;
    try {
      const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (raw) data = JSON.parse(raw);
    } catch (err) {}

    const item = data || draggedItem;
    if (!item) return;

    if (item.type === 'reel') {
      const reelId = item.id || (item as any).reelId;
      if (!reelId) {
        setDraggedItem(null);
        return;
      }

      setReels(prev => prev.map(r => r.id === reelId ? { ...r, category_id: targetCatId } : r));

      try {
        const { error } = await supabase.from('reels').update({ category_id: targetCatId }).eq('id', reelId);
        if (error) throw error;
        const targetCat = categories.find(c => c.id === targetCatId);
        showIncomingAlert(`Moved reel into "${targetCat?.name || 'Category'}" ✓`);
      } catch (err: any) {
        console.error('Failed to move reel:', err);
        alert(`Failed to move reel: ${err.message || err}`);
        await loadData();
      }
    } else if (item.type === 'folder') {
      const folderId = item.id || (item as any).folderId;
      if (!folderId || folderId === targetCatId) {
        setDraggedItem(null);
        return;
      }

      // Reject if targetCatId is a descendant of folderId
      let curr: string | null = targetCatId;
      let isDescendant = false;
      while (curr) {
        if (curr === folderId) {
          isDescendant = true;
          break;
        }
        const parentCat = categories.find(c => c.id === curr);
        curr = parentCat ? parentCat.parent_id : null;
      }
      if (isDescendant) {
        setDraggedItem(null);
        alert('Cannot move a folder into its own subfolder.');
        return;
      }

      setCategories(prev => prev.map(c => c.id === folderId ? { ...c, parent_id: targetCatId } : c));

      try {
        const { error } = await supabase.from('categories').update({ parent_id: targetCatId }).eq('id', folderId);
        if (error) throw error;
        const targetCat = categories.find(c => c.id === targetCatId);
        showIncomingAlert(`Nested folder inside "${targetCat?.name || 'Parent Folder'}" ✓`);
      } catch (err: any) {
        console.error('Failed to nest folder:', err);
        alert(`Failed to nest folder: ${err.message || err}`);
        await loadData();
      }
    }

    setDraggedItem(null);
  };

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

  // Close any open lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailReelId) setDetailReelId(null);
        if (categoryLightbox) setCategoryLightbox(null);
        if (editingCategory) setEditingCategory(null);
        if (showClearHistoryLightbox && !isClearingHistory) setShowClearHistoryLightbox(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailReelId, categoryLightbox, editingCategory, showClearHistoryLightbox, isClearingHistory]);

  // Close active 3-dot card menu on outside click or Escape
  useEffect(() => {
    if (!activeCardMenuId) return;
    const handleOutsideClick = () => setActiveCardMenuId(null);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveCardMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [activeCardMenuId]);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedPins = localStorage.getItem('watchlater_pinned_folders');
      if (savedPins) setPinnedFolderIds(JSON.parse(savedPins));
    } catch (e) { }

    try {
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
    } catch (e) { }

    // Read category metadata independently and enable synchronization only when read succeeds
    try {
      const savedCatMeta = localStorage.getItem('watchlater_category_meta');
      if (savedCatMeta) setCategoryMetaMap(JSON.parse(savedCatMeta));
      setMetaLoaded(true);
    } catch (e) {
      console.warn('Failed to parse category metadata from localStorage:', e);
    }
  }, []);

  // Track first-time account persona celebration
  useEffect(() => {
    if (session?.user?.id) {
      const seen = localStorage.getItem(`watchlater_persona_celebrated_${session.user.id}`);
      if (!seen) {
        setIsFirstTimePersona(true);
      }
      const guideCompleted = localStorage.getItem(`watchlater_guide_completed_${session.user.id}`);
      if (!guideCompleted) {
        setShowGameGuide(true);
      }
    }
  }, [session]);

  const dismissFirstTimePersona = () => {
    if (session?.user?.id) {
      localStorage.setItem(`watchlater_persona_celebrated_${session.user.id}`, 'true');
    }
    setIsFirstTimePersona(false);
  };

  const dismissGameGuide = () => {
    if (session?.user?.id) {
      localStorage.setItem(`watchlater_guide_completed_${session.user.id}`, 'true');
    }
    setShowGameGuide(false);
  };

  // Category state reconciliation
  useEffect(() => {
    if (selectedCategoryId && !categories.some(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
    if (categoryLightbox && !categories.some(c => c.id === categoryLightbox.id)) {
      setCategoryLightbox(null);
    }
  }, [categories, selectedCategoryId, categoryLightbox]);

  const loadSavedLaterIdsForUser = useCallback((userId: string | null | undefined): string[] => {
    if (!userId) return [];
    try {
      const userSaved = localStorage.getItem(`watchlater_saved_later_ids_${userId}`);
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed)) {
          return parsed.filter((id): id is string => typeof id === 'string');
        }
      }
    } catch (e) { }
    return [];
  }, []);

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

  const toggleSaveLater = (reelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const userId = session?.user?.id;
    setSavedLaterIds(prev => {
      const next = prev.includes(reelId) ? prev.filter(id => id !== reelId) : [reelId, ...prev];
      if (userId) {
        try {
          localStorage.setItem(`watchlater_saved_later_ids_${userId}`, JSON.stringify(next));
        } catch (err) { }
      }
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

      // Fetch all reels across pages to prevent silent truncation under Supabase max-rows limits
      const fetchAllReels = async (): Promise<{ data: Reel[] | null; error: any }> => {
        const pageSize = 1000;
        let all: Reel[] = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
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

          if (error) {
            return { data: all.length > 0 ? all : null, error };
          }

          if (data && data.length > 0) {
            all = all.concat(data as Reel[]);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              from += pageSize;
            }
          } else {
            hasMore = false;
          }
        }

        return { data: all, error: null };
      };

      const reelsPromise = fetchAllReels();

      const catsPromise = supabase
        .from('categories')
        .select('*')
        .order('name');

      const devsPromise = supabase
        .from('devices')
        .select('*')
        .order('last_synced_at', { ascending: false });

      const [reelsRes, catsRes, devsRes] = await Promise.all([reelsPromise, catsPromise, devsPromise]);

      if (reelsRes.error) {
        console.error('Error fetching reels:', reelsRes.error);
      }
      if (catsRes.error) {
        console.error('Error fetching categories:', catsRes.error);
      }
      if (devsRes.error) {
        console.error('Error fetching devices:', devsRes.error);
      }

      const { data: { session: latestSession } } = await supabase.auth.getSession();
      if (latestSession?.user?.id === requestUserId) {
        if (reelsRes.data) {
          const fetchedReels = reelsRes.data as Reel[];
          const fetchedIds = new Set(fetchedReels.map(r => r.id));

          // Functional update for setReels to preserve concurrent realtime updates
          setReels(prevReels => {
            const recentNewReels = prevReels.filter(r => !fetchedIds.has(r.id));
            return [...recentNewReels, ...fetchedReels];
          });

          // Reconcile saved-later IDs using functional update only after an error-free fetch
          if (!reelsRes.error) {
            setSavedLaterIds(prevSaved => prevSaved.filter(id => typeof id === 'string' && fetchedIds.has(id)));
          }
        }
        if (catsRes.data) setCategories(catsRes.data as Category[]);
        if (devsRes.data) setDevices(devsRes.data as Device[]);
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
      setSavedLaterIds(loadSavedLaterIdsForUser(session?.user?.id));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      const prevUserId = sessionRef.current?.user?.id;
      const nextUserId = newSession?.user?.id;

      if (!nextUserId) {
        setReels([]);
        setCategories([]);
        setDevices([]);
        setSavedLaterIds([]);
      } else if (nextUserId !== prevUserId) {
        setReels([]);
        setCategories([]);
        setDevices([]);
        setSavedLaterIds(loadSavedLaterIdsForUser(nextUserId));
      }

      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadSavedLaterIdsForUser]);

  // Persist savedLaterIds tied to the active user's key
  useEffect(() => {
    const currentUserId = session?.user?.id;
    if (currentUserId && !loading) {
      try {
        localStorage.setItem(`watchlater_saved_later_ids_${currentUserId}`, JSON.stringify(savedLaterIds));
      } catch (e) { }
    }
  }, [savedLaterIds, session?.user?.id, loading]);

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
              showIncomingAlert(newReel.url);
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
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'devices' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newDev = payload.new as Device;
              setDevices((prev) => {
                if (prev.some(d => d.id === newDev.id)) return prev;
                return [...prev, newDev];
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any).id;
              setDevices((prev) => prev.filter(d => d.id !== deletedId));
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Device;
              setDevices((prev) => prev.map(d => d.id === updated.id ? updated : d));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, loadData, showIncomingAlert]);

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
          color: editCategoryColor,
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
          return reel.completion_status !== 'archived' && !reel.is_failed && reel.processing_status !== 'extraction_failed';
        case 'savelater':
          return savedLaterIds.includes(reel.id);
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
  }, [reels, currentPage, selectedCategoryId, searchQuery, postTypeFilter, savedLaterIds]);

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
  const rootCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

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

  const pinnedCategories = useMemo(() => {
    return categories.filter(c => pinnedFolderIds.includes(c.id));
  }, [categories, pinnedFolderIds]);

  const counts = useMemo(() => ({
    all: reels.filter(r => r.completion_status !== 'archived' && !r.is_failed && r.processing_status !== 'extraction_failed').length,
    savelater: reels.filter(r => savedLaterIds.includes(r.id)).length,
    inbox: reels.filter(r => r.processing_status === 'pending' || r.processing_status === 'resolving').length,
    failed: reels.filter(r => r.is_failed || r.processing_status === 'extraction_failed').length,
    watched: reels.filter(r => r.completion_status === 'completed').length,
    archived: reels.filter(r => r.completion_status === 'archived').length,
    categories: categories.length
  }), [reels, categories, savedLaterIds]);

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
      {/* Toast Alert for Incoming Reels */}
      {incomingAlert && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-white/10 bg-panel/95 p-4 shadow-2xl backdrop-blur animate-fade-up">
          <Bell className="h-5 w-5 text-cyanbrand animate-pulse" />
          <div>
            <p className="text-xs font-semibold text-ink">New Content Captured!</p>
            <p className="text-[11px] text-ink-subtle truncate max-w-xs">{incomingAlert}</p>
          </div>
          <button onClick={clearIncomingAlert} className="text-ink-subtle hover:text-ink">✕</button>
        </div>
      )}

      {/* Navigation Sidebar (Desktop + Mobile Drawer) */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={`${sidebarCollapsed ? 'w-72 md:w-20' : 'w-72 md:w-72 lg:w-76 xl:w-80 2xl:w-88'
          } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } fixed md:static inset-y-0 left-0 z-40 transition-all duration-300 border-r border-[#333333] bg-[#0B0B0B]/95 md:bg-[#0B0B0B]/80 backdrop-blur p-3.5 sm:p-4 flex flex-col justify-between select-none shrink-0`}
      >
        <div className="overflow-y-auto overflow-x-hidden">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between px-2 py-3 mb-2">
            <a
              href="/"
              className={`flex items-center gap-3 cursor-pointer hover:opacity-85 transition ${sidebarCollapsed ? 'flex md:hidden' : 'flex'}`}
              title="Return to Landing Page"
            >
              <img src="/logo.jpg" alt="Watch Later" className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl object-cover shadow-md border border-white/15 shrink-0" />
              <div>
                <span className="font-oughter text-xl font-bold tracking-tight text-white block leading-none">Watch Later</span>
                <span className="text-[11px] text-[#7E7E7E] block leading-tight mt-1">Never lose a reel worth revisiting.</span>
              </div>
            </a>
            {sidebarCollapsed && (
              <a
                href="/"
                className="hidden md:flex items-center justify-center py-1 hover:opacity-85 transition"
                title="Return to Landing Page"
              >
                <img src="/logo.jpg" alt="Watch Later" className="h-10 w-10 rounded-xl object-cover shadow-md border border-white/15" />
              </a>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:inline-flex p-1 rounded hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="md:hidden p-1 rounded hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1">
            <button
              onClick={() => { setCurrentPage('home'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-start gap-2.5 md:justify-center' : 'gap-2.5'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'home' ? 'bg-[#1A1A1A] text-white font-semibold border border-[#333333]' : 'text-[#6B6B6B] hover:bg-[#1A1A1A] hover:text-[#D9D9D9]'
                }`}
              title="Home (Stats & Insights)"
            >
              <Home className="h-4 w-4 shrink-0 text-white" />
              <span className={sidebarCollapsed ? 'inline md:hidden' : 'inline'}>Home</span>
            </button>

            <button
              onClick={() => { setCurrentPage('all'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-between md:justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'all' && !selectedCategoryId ? 'bg-[#1A1A1A] text-white font-semibold border border-[#333333]' : 'text-[#6B6B6B] hover:bg-[#1A1A1A] hover:text-[#D9D9D9]'
                }`}
              title="All Content"
            >
              <div className="flex items-center gap-2.5">
                <Film className="h-4 w-4 shrink-0" />
                <span className={sidebarCollapsed ? 'inline md:hidden' : 'inline'}>All Content</span>
              </div>
              <span className={`font-mono-micro text-[#6B6B6B] ${sidebarCollapsed ? 'inline md:hidden' : 'inline'}`}>{counts.all}</span>
            </button>

            {/* Renamed from Sorted Saves to Categories */}
            <button
              onClick={() => { setCurrentPage('categories'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-between md:justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'categories' && !selectedCategoryId ? 'bg-[#1A1A1A] text-white font-semibold border border-[#333333]' : 'text-[#6B6B6B] hover:bg-[#1A1A1A] hover:text-[#D9D9D9]'
                }`}
              title="Categories"
            >
              <div className="flex items-center gap-2.5">
                <FolderTree className="h-4 w-4 shrink-0 text-white" />
                <span className={sidebarCollapsed ? 'inline md:hidden' : 'inline'}>Categories</span>
              </div>
              <span className={`font-mono-micro text-[#6B6B6B] ${sidebarCollapsed ? 'inline md:hidden' : 'inline'}`}>{counts.categories}</span>
            </button>

            {/* Save Later Page */}
            <button
              onClick={() => { setCurrentPage('savelater'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-between md:justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'savelater' ? 'bg-[#1A1A1A] text-white font-semibold border border-[#333333]' : 'text-[#6B6B6B] hover:bg-[#1A1A1A] hover:text-[#D9D9D9]'
                }`}
              title="Save Later (Bookmarks)"
            >
              <div className="flex items-center gap-2.5">
                <Bookmark className="h-4 w-4 shrink-0" />
                <span className={sidebarCollapsed ? 'inline md:hidden' : 'inline'}>Save Later</span>
              </div>
              <span className={`font-mono-micro text-[#6B6B6B] ${sidebarCollapsed ? 'inline md:hidden' : 'inline'}`}>{counts.savelater}</span>
            </button>

            <button
              onClick={() => { setCurrentPage('watched'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-between md:justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'watched' ? 'bg-[#1A1A1A] text-white font-semibold border border-[#333333]' : 'text-[#6B6B6B] hover:bg-[#1A1A1A] hover:text-[#D9D9D9]'
                }`}
              title="Watched"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 shrink-0 text-[#D9D9D9]" />
                <span className={sidebarCollapsed ? 'inline md:hidden' : 'inline'}>Watched</span>
              </div>
              <span className={`font-mono-micro text-[#6B6B6B] ${sidebarCollapsed ? 'inline md:hidden' : 'inline'}`}>{counts.watched}</span>
            </button>

            <button
              onClick={() => { setCurrentPage('inbox'); setSelectedCategoryId(null); setMobileMenuOpen(false); }}
              className={`flex w-full items-center ${sidebarCollapsed ? 'justify-between md:justify-center' : 'justify-between'} rounded-lg px-2.5 py-2 text-xs font-medium transition ${currentPage === 'inbox' ? 'bg-[#1A1A1A] text-white font-semibold border border-[#333333]' : 'text-[#6B6B6B] hover:bg-[#1A1A1A] hover:text-[#D9D9D9]'
                }`}
              title="Inbox"
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="h-4 w-4 shrink-0" />
                <span className={sidebarCollapsed ? 'inline md:hidden' : 'inline'}>Inbox</span>
              </div>
              <span className={`font-mono-micro text-[#6B6B6B] ${sidebarCollapsed ? 'inline md:hidden' : 'inline'}`}>{counts.inbox}</span>
            </button>
          </div>

          {/* Pinned Folders */}
          <div className="mt-5 space-y-1">
            <div className={`px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#999999] items-center gap-1.5 ${sidebarCollapsed ? 'flex md:hidden' : 'flex'}`}>
              <Pin className="h-3 w-3 text-[#D9D9D9]" />
              <span>Pinned Folders</span>
            </div>
            {pinnedCategories.map((cat) => {
              const count = reels.filter(r => r.category_id === cat.id || r.subcategory_id === cat.id).length;
              const catIcon = categoryMetaMap[cat.id]?.icon || 'Tag';
              const theme = getCategoryTheme(catIcon, categoryMetaMap[cat.id]?.color);
              return (
                <button
                  key={cat.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedItem({ type: 'folder', id: cat.id });
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: cat.id }));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverCatId(cat.id);
                  }}
                  onDragLeave={() => setDragOverCatId(null)}
                  onDrop={(e) => handleDropOnCategory(cat.id, e)}
                  onClick={() => {
                    setCurrentPage('categories');
                    setSelectedCategoryId(cat.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center ${sidebarCollapsed ? 'justify-between md:justify-center' : 'justify-between'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition group ${
                    dragOverCatId === cat.id
                      ? 'bg-[#2E2E2E] ring-1 ring-white/50 text-white shadow-md'
                      : currentPage === 'categories' && selectedCategoryId === cat.id
                        ? 'bg-[#1A1A1A] text-white font-semibold border border-[#333333]'
                        : 'text-[#999999] hover:bg-[#1A1A1A] hover:text-white'
                  }`}
                  title={`${cat.name} (Click to open, or drop items here)`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`p-1 rounded-md ${theme.bg} ${theme.text} ${theme.border} border shrink-0`}>
                      {renderCategoryIcon(catIcon, `h-3 w-3 ${theme.text}`)}
                    </span>
                    <span className={`truncate ${sidebarCollapsed ? 'inline md:hidden' : 'inline'}`}>{cat.name}</span>
                  </div>
                  <div className={`items-center gap-1.5 ${sidebarCollapsed ? 'flex md:hidden' : 'flex'}`}>
                    <span className="font-mono-micro text-[#6B6B6B]">{count}</span>
                    <span
                      onClick={(e) => togglePin(cat.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded transition"
                    >
                      <PinOff className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#333333] pt-3 mt-2 space-y-1">
          <button
            onClick={() => { setCurrentPage('settings'); setMobileMenuOpen(false); }}
            className={`flex w-full items-center ${sidebarCollapsed ? 'justify-start gap-2 md:justify-center' : 'gap-2'} rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${currentPage === 'settings' ? 'bg-[#1A1A1A] text-white font-semibold border border-[#333333]' : 'text-[#6B6B6B] hover:bg-[#1A1A1A] hover:text-[#D9D9D9]'
              }`}
            title="Settings"
          >
            <SettingsIcon className="h-3.5 w-3.5 shrink-0" />
            <span className={sidebarCollapsed ? 'inline md:hidden' : 'inline'}>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-fabric">
        {/* Top Header - scaled by 10% */}
        <header className="flex items-center justify-between border-b border-[#333333] bg-[#0B0B0B]/60 backdrop-blur px-4 sm:px-7 py-3.5 sm:py-4 gap-3.5 min-h-[64px]">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-full">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-[#333333] bg-[#1A1A1A] text-[#D9D9D9] hover:text-white shrink-0"
              title="Open Navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Page title: smoothly hidden when sidebar is extended (!sidebarCollapsed), smoothly brings title when sidebar is collapsed (sidebarCollapsed) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${!sidebarCollapsed
                  ? 'max-w-0 opacity-0 pointer-events-none -translate-x-3'
                  : 'max-w-[280px] sm:max-w-xs opacity-100 translate-x-0 mr-2.5'
                }`}
            >
              <h2 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
                {currentPage === 'home' && 'Analytics & Intelligence'}
                {currentPage === 'all' && 'All Saved Content'}
                {currentPage === 'categories' && (selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || 'Category' : 'Categories Directory')}
                {currentPage === 'savelater' && 'Save Later'}
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
                      <div className="flex items-center gap-2 shrink-0 animate-in fade-in zoom-in-90 duration-200">
                        <span className="font-mono text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/15 tabular-nums">
                          {displayedReels.length} match{displayedReels.length === 1 ? '' : 'es'}
                        </span>
                        <button onClick={() => setSearchQuery('')} className="text-[#6B6B6B] hover:text-white text-xs p-0.5">✕</button>
                      </div>
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

            {/* Apple Liquid Glass "How to Play" Guide Trigger */}
            <button
              onClick={() => setShowGameGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] text-xs font-semibold text-white transition active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-xl shrink-0"
              title="How to Play / Interactive Guide"
            >
              <Gamepad2 className="h-3.5 w-3.5 text-cyan-300" />
              <span className="hidden sm:inline">How to Play</span>
            </button>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-up">
          {/* HOME VIEW: BENTO STATS & NICHE DISTRIBUTION */}
          {currentPage === 'home' && (
            <div className="space-y-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-micro text-[#D9D9D9] font-medium tracking-wider">WATCHED</span>
                    <Film className="h-4 w-4 text-[#D9D9D9]" />
                  </div>
                  <div className="font-oughter text-3xl font-bold text-white tracking-tight">
                    <NumberTicker value={counts.watched} />
                  </div>
                  <span className="font-mono-micro text-[#6B6B6B] mt-2 block">
                    <NumberTicker value={reels.length} /> total saved ({reels.length > 0 ? Math.round((counts.watched / reels.length) * 100) : 0}%)
                  </span>
                </div>

                <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-micro text-[#D9D9D9] font-medium tracking-wider">CATEGORIES</span>
                    <FolderTree className="h-4 w-4 text-[#D9D9D9]" />
                  </div>
                  <div className="font-oughter text-3xl font-bold text-white tracking-tight">
                    <NumberTicker value={categories.length} />
                  </div>
                  <span className="font-mono-micro text-[#6B6B6B] mt-2 block">
                    <NumberTicker value={rootCategories.length} /> primary, <NumberTicker value={categories.length - rootCategories.length} /> sub-niches
                  </span>
                </div>

                <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-micro text-[#D9D9D9] font-medium tracking-wider">CONNECTED DEVICES</span>
                    <Smartphone className="h-4 w-4 text-[#D9D9D9]" />
                  </div>
                  <div className="font-oughter text-3xl font-bold text-white tracking-tight">
                    <NumberTicker value={devices.length} />
                  </div>
                  <span className="font-mono-micro text-[#6B6B6B] mt-2 block">
                    {devices.length > 0 ? (devices[0]?.device_name || 'Active Android / iOS') : 'No devices synced'}
                  </span>
                </div>
              </div>

              {/* Persona Insights - Attractive Celebratory State on First Generation, Minimal Thereafter */}
              {showPersonaInsights && (
                isFirstTimePersona ? (
                  <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-r from-emerald-500/40 via-cyan-400/30 via-indigo-500/40 to-purple-500/40 shadow-[0_0_35px_rgba(52,211,153,0.15)] overflow-hidden transition-all duration-500">
                    <div className="relative rounded-2xl bg-[#141414]/95 backdrop-blur-xl p-6 sm:p-7">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 shadow-sm animate-pulse">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-oughter text-base font-bold text-white tracking-tight">Vault Intelligence Persona</h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                                ✨ Synthesized
                              </span>
                            </div>
                            <span className="text-[11px] text-[#888888]">Your taste profile is primed and ready</span>
                          </div>
                        </div>

                        <button
                          onClick={dismissFirstTimePersona}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition active:scale-95"
                          title="Dismiss celebration and keep standard view"
                        >
                          Got it ✓
                        </button>
                      </div>

                      <p className="text-sm text-zinc-200 leading-relaxed font-sans mb-3 font-medium">
                        {userPersonaInsight}
                      </p>

                      <div className="h-1 w-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 opacity-60" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-[#D9D9D9]" />
                        <h3 className="font-oughter text-sm font-bold text-white tracking-tight">Vault Intelligence Persona</h3>
                      </div>
                      {reels.length < 20 && (
                        <span className="font-mono-micro text-[#6B6B6B] bg-[#0B0B0B] px-2.5 py-1 rounded-full border border-[#333333]">
                          {reels.length} / 20 SAVED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#D9D9D9] leading-relaxed font-sans">
                      {userPersonaInsight}
                    </p>
                  </div>
                )
              )}

              {/* Compressed Niche Category Distribution */}
              <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-oughter text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-[#D9D9D9]" />
                    <span>Niche Category Breakdown</span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rootCategories.map(cat => {
                    const count = reels.filter(r => r.category_id === cat.id).length;
                    const pct = reels.length > 0 ? Math.round((count / reels.length) * 100) : 0;
                    return (
                      <div key={cat.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[#262626] bg-[#0B0B0B]/70 hover:bg-[#141414] transition">
                        <span className="text-xs font-medium text-[#D9D9D9] w-28 sm:w-36 truncate">{cat.name}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden border border-[#333333]/40">
                          <div className="h-full bg-[#D9D9D9] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono-micro text-[#6B6B6B] shrink-0 text-right tabular-nums">
                          <NumberTicker value={count} /> posts ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES DIRECTORY: INTERACTIVE FOLDER TILES */}
          {currentPage === 'categories' && !selectedCategoryId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight">Categories Directory</h3>
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
                    Create
                  </button>
                </form>
              )}

              {/* Minimalist, Responsive Folder-Type Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5">
                {rootCategories.map(cat => {
                  const count = reels.filter(r => r.category_id === cat.id).length;
                  const isPinned = pinnedFolderIds.includes(cat.id);
                  const isDragOver = dragOverCatId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedItem({ type: 'folder', id: cat.id });
                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: cat.id, folderId: cat.id }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => setDraggedItem(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverCatId(cat.id);
                      }}
                      onDragLeave={() => setDragOverCatId(null)}
                      onDrop={(e) => handleDropOnCategory(cat.id, e)}
                      className={`group relative rounded-xl border transition shadow-sm overflow-hidden ${
                        isDragOver ? 'ring-2 ring-white border-white bg-[#262626] scale-105' : 'border-[#333333] bg-[#1A1A1A]/80 hover:bg-[#1A1A1A] hover:border-[#6B6B6B]'
                      }`}
                    >
                      {/* Top Action Buttons (Pin, Edit & Delete) as Sibling Interactive Elements */}
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
                          aria-label={`Edit ${cat.name}`}
                          className="p-1 rounded-md text-[#6B6B6B] hover:text-white hover:bg-[#333333] text-xs transition"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => togglePin(cat.id, e)}
                          title={isPinned ? 'Unpin category' : 'Pin category'}
                          aria-label={isPinned ? `Unpin ${cat.name}` : `Pin ${cat.name}`}
                          className={`p-1 rounded-md text-xs transition ${isPinned ? 'text-white bg-[#333333]' : 'text-[#6B6B6B] hover:text-white hover:bg-[#333333]'}`}
                        >
                          <Pin className={`h-3 w-3 ${isPinned ? 'fill-white' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCategory(cat.id, e)}
                          title="Delete category"
                          aria-label={`Delete ${cat.name}`}
                          className="p-1 rounded-md text-[#6B6B6B] hover:text-red-400 hover:bg-[#333333] text-xs transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Main Category Opening Control */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="w-full h-full flex flex-col items-center justify-center p-3.5 sm:p-4 focus:outline-none focus:ring-1 focus:ring-[#D9D9D9] text-center"
                      >
                        <div className="relative mb-2">
                          {(() => {
                            const iconName = categoryMetaMap[cat.id]?.icon || 'Folder';
                            const theme = getCategoryTheme(iconName, categoryMetaMap[cat.id]?.color);
                            return (
                              <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.border} border group-hover:scale-105 transition shadow-sm`}>
                                {renderCategoryIcon(iconName, `h-7 w-7 ${theme.text}`)}
                              </div>
                            );
                          })()}
                        </div>
                        <span className="text-xs font-semibold text-white truncate w-full mb-0.5">
                          {cat.name}
                        </span>
                        {categoryMetaMap[cat.id]?.description && (
                          <span className="text-[10px] text-[#6B6B6B] line-clamp-1 w-full mb-0.5">
                            {categoryMetaMap[cat.id]?.description}
                          </span>
                        )}
                        <span className="font-mono-micro text-[#6B6B6B]">
                          {count} items
                        </span>
                      </button>
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
                <div className="mb-4 rounded-xl border border-[#333333] bg-[#1A1A1A] p-3 flex items-center gap-2.5 text-xs text-[#D9D9D9]">
                  <Clock className="h-4 w-4 text-[#D9D9D9] shrink-0" />
                  <span>
                    <strong>Automatic Deletion Notice:</strong> Posts stored in the Archived folder are permanently purged based on your retention preference ({retentionPeriod === 'day' ? '1 day' : retentionPeriod === 'week' ? '1 week' : '1 month cap'}).
                  </span>
                </div>
              )}

              {/* Breadcrumb back button when inside a specific category */}
              {selectedCategoryId && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className="text-xs text-[#D9D9D9] hover:underline"
                    >
                      ← Back to Categories
                    </button>
                    <span className="text-[#6B6B6B]">/</span>
                    <span className="text-xs text-white font-semibold">
                      {categories.find(c => c.id === selectedCategoryId)?.name}
                    </span>
                  </div>

                  {/* Subfolders inside this selected category */}
                  {(() => {
                    const subCats = categories.filter(c => c.parent_id === selectedCategoryId);
                    if (subCats.length === 0) return null;
                    return (
                      <div className="p-3 rounded-xl border border-[#2E2E2E] bg-[#141414]/90 backdrop-blur space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373] block">
                          Nested Folders ({subCats.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {subCats.map(sub => {
                            const subCount = reels.filter(r => r.category_id === sub.id || r.subcategory_id === sub.id).length;
                            const isOver = dragOverCatId === sub.id;
                            return (
                              <button
                                key={sub.id}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedItem({ type: 'folder', id: sub.id });
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
                                onDrop={(e) => handleDropOnCategory(sub.id, e)}
                                onClick={() => setSelectedCategoryId(sub.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs text-white transition ${
                                  isOver ? 'ring-2 ring-white border-white bg-[#222]' : 'border-[#333333] bg-[#0A0A0A] hover:bg-[#1A1A1A] hover:border-[#666]'
                                }`}
                              >
                                <Folder className="h-3.5 w-3.5 text-zinc-400" />
                                <span>{sub.name}</span>
                                <span className="font-mono text-[10px] text-[#737373]">({subCount})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SAVE LATER CATEGORY QUICK BAR & DRAG-AND-DROP STRIP */}
              {currentPage === 'savelater' && (
                <div className="mb-6 rounded-2xl border border-[#2A2A2A] bg-[#121212]/90 backdrop-blur p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-white" />
                        <h3 className="font-oughter text-sm font-bold text-white tracking-tight">Category Folders</h3>
                        <span className="font-mono-micro text-[#888888]">
                          ({rootCategories.length} folders)
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5">
                        Drag any saved reel below into a folder. Drag folders into folders to nest them. Click any folder to open instantly.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                        className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-zinc-200 text-[#0B0B0B] px-3 py-1.5 text-xs font-semibold transition active:scale-95 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>New Category</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Category Creation Form */}
                  {isCreatingCategory && (
                    <form onSubmit={handleCreateCategory} className="p-3 rounded-xl border border-[#333333] bg-[#0E0E0E] flex flex-wrap items-center gap-2 animate-fade-up">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name (e.g. Design, Workflows, Recipes)..."
                        className="flex-1 min-w-[200px] rounded-lg border border-[#333333] bg-[#050505] px-3 py-1.5 text-xs text-white placeholder-[#666] focus:border-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={categoryInsertPending}
                        className="rounded-lg bg-white hover:bg-zinc-200 text-[#0B0B0B] px-3.5 py-1.5 text-xs font-semibold transition active:scale-95"
                      >
                        {categoryInsertPending ? 'Creating...' : 'Create Folder'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsCreatingCategory(false); setNewCategoryName(''); }}
                        className="rounded-lg border border-[#333333] hover:bg-[#1A1A1A] text-zinc-400 px-2.5 py-1.5 text-xs transition"
                      >
                        Cancel
                      </button>
                    </form>
                  )}

                  {/* Horizontal Folders Strip (Draggable, Droppable, Click to open instantly) */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-1 scrollbar-thin scrollbar-thumb-zinc-700">
                    {rootCategories.map((cat) => {
                      const count = reels.filter(r => r.category_id === cat.id).length;
                      const subCats = categories.filter(c => c.parent_id === cat.id);
                      const iconName = categoryMetaMap[cat.id]?.icon || 'Folder';
                      const theme = getCategoryTheme(iconName, categoryMetaMap[cat.id]?.color);
                      const isDragOver = dragOverCatId === cat.id;

                      return (
                        <div
                          key={cat.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedItem({ type: 'folder', id: cat.id });
                            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: cat.id, folderId: cat.id }));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => setDraggedItem(null)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverCatId(cat.id);
                          }}
                          onDragLeave={() => setDragOverCatId(null)}
                          onDrop={(e) => handleDropOnCategory(cat.id, e)}
                          onClick={() => {
                            setCurrentPage('categories');
                            setSelectedCategoryId(cat.id);
                          }}
                          className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer select-none shrink-0 transition-all duration-200 ${
                            isDragOver
                              ? 'ring-2 ring-white border-white bg-[#262626] scale-105 shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                              : 'border-[#2E2E2E] bg-[#171717] hover:border-[#666] hover:bg-[#1E1E1E]'
                          }`}
                          title={`Click to open "${cat.name}". Drag reel here to move, or drag another folder here to nest.`}
                        >
                          <div className={`p-1.5 rounded-lg ${theme.bg} ${theme.border} border group-hover:scale-105 transition`}>
                            {renderCategoryIcon(iconName, `h-4 w-4 ${theme.text}`)}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-semibold text-white group-hover:text-zinc-100 transition truncate max-w-[120px]">
                              {cat.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#888888] tabular-nums">
                              {count} items {subCats.length > 0 ? `· ${subCats.length} sub` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  density === 'compact'
                    ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5"
                    : density === 'spacious'
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
                }>
                  {displayedReels.map((reel) => {
                    const extractionErr = Array.isArray(reel.extracted_content)
                      ? reel.extracted_content[0]?.extraction_error
                      : reel.extracted_content?.extraction_error;
                    const isPending = reel.processing_status === 'pending' || reel.processing_status === 'resolving';
                    const isThisRetrying = retryingId === reel.id || isPending;

                    const catObj = categories.find(c => c.id === reel.category_id);
                    const subObj = categories.find(c => c.id === reel.subcategory_id);

                    return (
                      <div
                        key={reel.id}
                        draggable={currentPage === 'savelater'}
                        onDragStart={(e) => {
                          if (currentPage !== 'savelater') return;
                          setDraggedItem({ type: 'reel', id: reel.id });
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
                        className={`group relative rounded-2xl border border-[#333333] bg-[#141414] overflow-hidden transition-all duration-300 hover:border-[#6B6B6B] hover:shadow-[0_16px_40px_rgba(0,0,0,0.75)] hover:-translate-y-1 flex flex-col justify-between aspect-[9/14] sm:aspect-[9/14] ${
                          currentPage === 'savelater' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        } ${density === 'compact' ? 'p-3' : density === 'spacious' ? 'p-5' : 'p-4'} ${
                          searchQuery ? 'animate-in fade-in zoom-in-[0.98] duration-200' : ''
                        }`}
                      >
                        {/* Full Card Length Thumbnail Background */}
                        {isPending ? (
                          <div className="absolute inset-0 bg-[#0B0B0B] flex flex-col items-center justify-center gap-3 z-0 text-white">
                            <Morph size={48} />
                            <span className="font-mono-micro text-[#A8A8A8] tracking-wider animate-pulse">PARSING REEL CONTENT...</span>
                          </div>
                        ) : showThumbnails && reel.thumbnail_url ? (
                          <img
                            src={reel.thumbnail_url}
                            alt={reel.ai_title || 'Thumbnail'}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1C] via-[#121212] to-[#0A0A0A]" />
                        )}

                        {/* Fade Effect from Card Bottom to Middle */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 via-45% to-black/20 pointer-events-none z-[1]" />

                        {/* Card Top: Floating Badges & 3-Dot Menu */}
                        <div className="relative z-10 flex items-start justify-between gap-1.5 w-full">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[80%]">
                            {catObj && (
                              <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 font-mono-micro text-white border border-white/15 shadow-sm truncate">
                                {catObj.name}{subObj ? ` / ${subObj.name}` : ''}
                              </span>
                            )}
                            {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                              <span className="rounded-full bg-red-950/80 backdrop-blur-md px-2.5 py-1 font-mono-micro text-red-300 border border-red-800/60 shadow-sm">
                                Issue
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 relative" onClick={(e) => e.stopPropagation()}>
                            {(reel.is_failed || reel.processing_status === 'extraction_failed') && (
                              <button
                                onClick={() => handleRetryExtraction(reel.id)}
                                disabled={isThisRetrying}
                                title="Retry Extraction"
                                className="p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white hover:bg-black/90 transition active:scale-90"
                              >
                                <RotateCcw className={`h-3.5 w-3.5 ${isThisRetrying ? 'animate-spin' : ''}`} />
                              </button>
                            )}

                            {/* 3 Vertical Dots with Save & More Info Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenuId(prev => prev === reel.id ? null : reel.id);
                                }}
                                title="Options"
                                aria-label="Options"
                                className={`p-1.5 rounded-full backdrop-blur-md border transition active:scale-90 relative ${
                                  activeCardMenuId === reel.id
                                    ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                                    : savedLaterIds.includes(reel.id)
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                    : 'bg-black/60 text-white/80 hover:text-white border-white/15 hover:border-white/30'
                                }`}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                                {savedLaterIds.includes(reel.id) && activeCardMenuId !== reel.id && (
                                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-black" />
                                )}
                              </button>

                              {/* Dropdown Menu */}
                              {activeCardMenuId === reel.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-white/20 bg-[#141414]/95 backdrop-blur-3xl shadow-[0_16px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.3)] p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 space-y-0.5 text-left"
                                >
                                  {/* Option 1: Save for Later */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSaveLater(reel.id, e);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                                      savedLaterIds.includes(reel.id)
                                        ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                                        : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Bookmark className={`h-3.5 w-3.5 ${savedLaterIds.includes(reel.id) ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                                      <span>{savedLaterIds.includes(reel.id) ? 'Saved for Later' : 'Save for Later'}</span>
                                    </div>
                                    {savedLaterIds.includes(reel.id) && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                    )}
                                  </button>

                                  {/* Option 2: Get More Info (Opens Lightbox Model) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveCardMenuId(null);
                                      setDetailReelId(reel.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-white/10 hover:text-white transition"
                                  >
                                    <Info className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>Get More Info</span>
                                  </button>

                                  <div className="h-px bg-white/10 my-1" />

                                  {/* Option 3: Direct Instagram Link */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveCardMenuId(null);
                                      if (reel.completion_status !== 'completed') {
                                        handleStatusChange(reel.id, 'completed');
                                      }
                                      window.open(reel.url, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>Open on Instagram</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom: Content info */}
                        <div className="relative z-10 w-full mt-auto pt-4">
                          {/* Title of Content */}
                          <h3 className="font-oughter font-bold text-white leading-snug text-sm sm:text-base mb-1.5 line-clamp-2 drop-shadow-sm group-hover:text-zinc-100 transition">
                            {reel.ai_title || 'Instagram Post'}
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                            {reel.ai_summary || reel.ai_description || reel.caption || 'No summary available'}
                          </p>

                          {/* Extraction Error Banner if failed */}
                          {(reel.is_failed || reel.processing_status === 'extraction_failed') && extractionErr && (
                            <div className="mt-2 rounded-lg bg-red-950/80 backdrop-blur-md p-1.5 text-[10px] text-red-200 border border-red-900/60">
                              <span className="font-mono break-all line-clamp-1">{extractionErr}</span>
                            </div>
                          )}
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
                    const isPending = reel.processing_status === 'pending' || reel.processing_status === 'resolving';
                    const isThisRetrying = retryingId === reel.id || isPending;

                    const catObj = categories.find(c => c.id === reel.category_id);
                    const subObj = categories.find(c => c.id === reel.subcategory_id);

                    return (
                      <div
                        key={reel.id}
                        draggable={currentPage === 'savelater'}
                        onDragStart={(e) => {
                          if (currentPage !== 'savelater') return;
                          setDraggedItem({ type: 'reel', id: reel.id });
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
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-[#333333] bg-[#1A1A1A]/90 ${density === 'compact' ? 'p-2.5 sm:py-2 sm:px-3' : density === 'spacious' ? 'p-4' : 'p-3'
                          } backdrop-blur hover:border-[#6B6B6B] ${currentPage === 'savelater' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${activeCardMenuId === reel.id ? 'relative z-20' : ''} transition shadow-sm`}
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
                                className="h-full w-full object-cover group-hover/thumb:scale-105 transition"
                              />
                            </div>
                          ) : null}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`rounded px-1.5 py-0.5 font-mono-micro ${reel.is_failed || reel.processing_status === 'extraction_failed'
                                  ? 'bg-red-950/60 text-red-400 border border-red-800/50'
                                  : reel.processing_status === 'processed'
                                    ? 'bg-[#0B0B0B] text-[#D9D9D9] border border-[#333333]'
                                    : 'bg-[#0B0B0B] text-[#6B6B6B] border border-[#333333]'
                                  }`}
                              >
                                {reel.processing_status}
                              </span>

                              {catObj && (
                                <span className="rounded bg-[#0B0B0B] px-1.5 py-0.5 font-mono-micro text-[#D9D9D9] border border-[#333333] truncate">
                                  {catObj.name}{subObj ? ` / ${subObj.name}` : ''}
                                </span>
                              )}
                            </div>

                            <h3 className="font-oughter font-semibold text-white leading-tight text-xs sm:text-sm truncate">
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
                                setActiveCardMenuId(prev => prev === reel.id ? null : reel.id);
                              }}
                              title="Options"
                              aria-label="Options"
                              className={`p-1.5 rounded-lg border transition active:scale-90 relative ${
                                activeCardMenuId === reel.id
                                  ? 'bg-white text-black border-white shadow-sm'
                                  : savedLaterIds.includes(reel.id)
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'border-[#333333] bg-[#0B0B0B] hover:bg-[#222222] text-[#888888] hover:text-white'
                              }`}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                              {savedLaterIds.includes(reel.id) && activeCardMenuId !== reel.id && (
                                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                              )}
                            </button>

                            {/* Dropdown Menu */}
                            {activeCardMenuId === reel.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-white/20 bg-[#141414]/95 backdrop-blur-3xl shadow-[0_16px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.3)] p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 space-y-0.5 text-left"
                              >
                                {/* Option 1: Save for Later */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSaveLater(reel.id, e);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                                    savedLaterIds.includes(reel.id)
                                      ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                                      : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Bookmark className={`h-3.5 w-3.5 ${savedLaterIds.includes(reel.id) ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                                    <span>{savedLaterIds.includes(reel.id) ? 'Saved for Later' : 'Save for Later'}</span>
                                  </div>
                                  {savedLaterIds.includes(reel.id) && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                  )}
                                </button>

                                {/* Option 2: Get More Info (Opens Lightbox Model) */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCardMenuId(null);
                                    setDetailReelId(reel.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-white/10 hover:text-white transition"
                                >
                                  <Info className="h-3.5 w-3.5 text-zinc-400" />
                                  <span>Get More Info</span>
                                </button>

                                <div className="h-px bg-white/10 my-1" />

                                {/* Option 3: Direct Instagram Link */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCardMenuId(null);
                                    if (reel.completion_status !== 'completed') {
                                      handleStatusChange(reel.id, 'completed');
                                    }
                                    window.open(reel.url, '_blank', 'noopener,noreferrer');
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                                  <span>Open on Instagram</span>
                                </button>
                              </div>
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

          {/* SETTINGS VIEW: MINIMAL, ELEGANT HORIZONTAL ROWS */}
          {currentPage === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-up">
              {/* Page Title & Intro */}
              <div className="border-b border-[#222222] pb-4">
                <h2 className="font-oughter text-xl sm:text-2xl font-bold text-white tracking-tight">Settings</h2>
                <p className="text-xs text-[#7E7E7E] mt-1">Configure your account, visual preferences, queue policies, and synchronization nodes.</p>
              </div>

              {/* Section 1: Account Settings */}
              <div className="space-y-4">
                {/* Row 1: Section Header Display */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <User className="h-4 w-4 text-white" />
                  <h3 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight">Account Settings</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  {/* Row 2: Email Address & User Email Beside It */}
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Email Address</span>
                      <span className="text-[11px] text-[#737373]">Primary account address for authentication and sync</span>
                    </div>
                    <span className="font-mono text-xs text-[#D9D9D9] bg-[#141414] border border-[#262626] px-3 py-1.5 rounded-lg select-all">
                      {session?.user?.email || 'No email attached'}
                    </span>
                  </div>

                  {/* Row 3: Change Password & Input Box Beside It with Update Button Right Next To It */}
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

                  {/* Row 4: Account Created At Info */}
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Account Created At</span>
                      <span className="text-[11px] text-[#737373]">Vault registration timestamp</span>
                    </div>
                    <span className="font-mono text-xs text-[#888888]">
                      {new Date(session?.user?.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Appearance & Layout */}
              <div className="space-y-4">
                {/* Row 1: Section Header Display */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Palette className="h-4 w-4 text-white" />
                  <h3 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight">Appearance &amp; Layout</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  {/* Row 2: Card Density */}
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
                      <option value="compact">Compact (Dense / High volume)</option>
                      <option value="comfortable">Comfortable (Balanced)</option>
                      <option value="spacious">Spacious (Large cards)</option>
                    </select>
                  </div>

                  {/* Row 3: Display Thumbnails */}
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

                  {/* Row 4: Persona Insights */}
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

                  {/* Row 5: Sidebar Collapsed */}
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

                  {/* Row 6: Interactive Tutorial Quest */}
                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Interactive Tutorial Quest</span>
                      <span className="text-[11px] text-[#737373]">Replay the Apple liquid glass &quot;How to Play&quot; guide anytime</span>
                    </div>
                    <button
                      onClick={() => setShowGameGuide(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white transition active:scale-95 shadow-sm"
                    >
                      <Gamepad2 className="h-3.5 w-3.5 text-cyan-300" />
                      <span>Replay Guide</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Archive Auto-Delete & Retention */}
              <div className="space-y-4">
                {/* Row 1: Section Header Display */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Clock className="h-4 w-4 text-white" />
                  <h3 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight">Archive Auto-Delete &amp; Retention</h3>
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
                {/* Row 1: Section Header Display */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Archive className="h-4 w-4 text-white" />
                  <h3 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight">Vault Status Queues</h3>
                </div>

                <div className="divide-y divide-[#1C1C1C]">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-white block">Status Queues</span>
                      <span className="text-[11px] text-[#737373]">Inspect extraction issues or view posts pending retention purge</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Failed Items Button: Recolored to match archived items button, small and minimal with hover info tooltip */}
                      <div className="relative group">
                        <button
                          onClick={() => { setCurrentPage('failed'); setSelectedCategoryId(null); }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2E2E2E] bg-[#121212] hover:bg-[#1A1A1A] hover:border-[#555555] text-xs font-medium text-white transition active:scale-95"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Failed Items</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-bold border border-white/10">
                            {counts.failed}
                          </span>
                        </button>

                        {/* Minimal Hover Info Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 animate-in fade-in zoom-in-95 duration-150">
                          <div className="rounded-md border border-[#3E3E3E] bg-[#1A1A1A] px-2.5 py-1 text-[11px] text-zinc-200 shadow-xl whitespace-nowrap">
                            {counts.failed} extraction error{counts.failed === 1 ? '' : 's'} · Click to view &amp; resolve
                          </div>
                          <div className="h-1 w-2 border-x-4 border-t-4 border-x-transparent border-t-[#1A1A1A]" />
                        </div>
                      </div>

                      {/* Archived Items Button: Small and minimal with hover info tooltip */}
                      <div className="relative group">
                        <button
                          onClick={() => { setCurrentPage('archived'); setSelectedCategoryId(null); }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2E2E2E] bg-[#121212] hover:bg-[#1A1A1A] hover:border-[#555555] text-xs font-medium text-white transition active:scale-95"
                        >
                          <Archive className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Archived Items</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-bold border border-white/10">
                            {counts.archived}
                          </span>
                        </button>

                        {/* Minimal Hover Info Tooltip */}
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
                {/* Row 1: Section Header Display */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Download className="h-4 w-4 text-white" />
                  <h3 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight">Data Management &amp; Export</h3>
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
                {/* Row 1: Section Header Display */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <Smartphone className="h-4 w-4 text-white" />
                  <h3 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight">Registered Devices &amp; Synchronization</h3>
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
                {/* Row 1: Section Header Display */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                  <LogOut className="h-4 w-4 text-white" />
                  <h3 className="font-oughter text-sm sm:text-base font-bold text-white tracking-tight">Session &amp; Logout</h3>
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

      {/* REEL DETAIL PANEL / LIGHTBOX */}
      {detailReel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-up"
          onClick={() => setDetailReelId(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#333333] bg-[#1A1A1A] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#333333] px-6 py-4 bg-[#0B0B0B]/60">
              <div className="flex items-center gap-3 truncate">
                <div className="h-8 w-8 rounded-lg bg-[#0B0B0B] border border-[#333333] flex items-center justify-center text-white shrink-0">
                  <Film className="h-4 w-4 text-[#D9D9D9]" />
                </div>
                <h3 className="font-oughter text-lg font-bold text-white truncate">
                  {detailReel.ai_title || 'Post Details'}
                </h3>
              </div>
              <button
                onClick={() => setDetailReelId(null)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#333333] hover:text-white transition"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {detailReel.thumbnail_url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0B0B0B] border border-[#333333] group/preview">
                    <img
                      src={detailReel.thumbnail_url}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                    <a
                      href={detailReel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/preview:opacity-100 transition"
                      title="Play Reel on Instagram"
                    >
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-black shadow-xl">
                        <Play className="h-5 w-5 fill-black ml-0.5" />
                      </div>
                    </a>
                  </div>
                ) : (detailReel.processing_status === 'pending' || detailReel.processing_status === 'resolving') ? (
                  <div className="aspect-video w-full rounded-xl bg-[#0B0B0B] border border-[#333333] flex flex-col items-center justify-center gap-3 text-white">
                    <Morph size={48} />
                    <span className="font-mono-micro text-[#A8A8A8] tracking-wider animate-pulse">PARSING REEL CONTENT...</span>
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl bg-[#0B0B0B] border border-[#333333] flex items-center justify-center text-[#6B6B6B] text-xs font-mono-micro">
                    [NO THUMBNAIL AVAILABLE]
                  </div>
                )}

                <div className="flex flex-col justify-between space-y-4 bg-[#0B0B0B] p-5 rounded-xl border border-[#333333]">
                  <div>
                    <span className="font-mono-micro text-[#6B6B6B] block mb-1">CREATOR</span>
                    <span className="text-base font-bold font-mono text-white">
                      {detailReel.creator_username ? `@${detailReel.creator_username}` : 'Unknown Creator'}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono-micro text-[#6B6B6B] block mb-1">TAXONOMY</span>
                    <span className="text-sm font-semibold text-[#D9D9D9]">
                      {categories.find(c => c.id === detailReel.category_id)?.name || 'Uncategorized'}
                      {detailReel.subcategory_id && ` / ${categories.find(c => c.id === detailReel.subcategory_id)?.name}`}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono-micro text-[#6B6B6B] block mb-1">SAVED TIMESTAMP</span>
                    <span className="text-xs text-[#999999] font-mono">
                      {new Date(detailReel.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {detailReel.ai_summary && (
                <div className="p-5 rounded-xl bg-[#0B0B0B] border border-[#333333]">
                  <span className="font-mono-micro text-[#D9D9D9] block mb-2 font-bold tracking-wider">[KEY TAKEAWAYS &amp; SUMMARY]</span>
                  <p className="text-sm text-[#D9D9D9] leading-relaxed whitespace-pre-wrap">
                    {detailReel.ai_summary}
                  </p>
                </div>
              )}

              {detailReel.ai_description && (
                <div className="p-5 rounded-xl bg-[#0B0B0B] border border-[#333333]">
                  <span className="font-mono-micro text-[#6B6B6B] block mb-2 font-bold tracking-wider">[DESCRIPTION]</span>
                  <p className="text-sm text-[#999999] leading-relaxed">
                    {detailReel.ai_description}
                  </p>
                </div>
              )}

              <div className="p-5 rounded-xl bg-[#0B0B0B] border border-[#333333]">
                <span className="font-mono-micro text-[#6B6B6B] block mb-2 font-bold tracking-wider">[ORIGINAL CAPTION]</span>
                <p className="text-xs text-[#999999] whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-relaxed">
                  {detailReel.caption || detailReel.raw_shared_text || 'No caption found'}
                </p>
              </div>

              {/* Direct Play Link */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-[#0B0B0B] border border-[#333333] gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-white block">Watch Original Instagram Reel</span>
                  <span className="text-[11px] text-[#6B6B6B] truncate block font-mono">{detailReel.url}</span>
                </div>
                <a
                  href={detailReel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-[#D9D9D9] active:scale-95 shrink-0"
                >
                  <Play className="h-3.5 w-3.5 fill-black" />
                  <span>Play on Instagram</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#333333] px-6 py-4 flex items-center justify-between bg-[#0B0B0B]">
              <span className="font-mono-micro text-[#6B6B6B]">
                STATUS: {detailReel.completion_status} ({detailReel.processing_status})
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={(e) => toggleSaveLater(detailReel.id, e)}
                  title="Save for Later"
                  aria-label="Save for Later"
                  aria-pressed={savedLaterIds.includes(detailReel.id)}
                  className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ${savedLaterIds.includes(detailReel.id)
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-[#333333] bg-[#1A1A1A] hover:bg-[#333333] text-[#D9D9D9]'
                    }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${savedLaterIds.includes(detailReel.id) ? 'fill-amber-400' : ''}`} />
                  <span>Save for Later</span>
                </button>
                <button
                  onClick={() => handleStatusChange(detailReel.id, 'completed')}
                  className="rounded-lg bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95"
                >
                  Mark Watched
                </button>
                <button
                  onClick={() => handleStatusChange(detailReel.id, 'archived')}
                  className="rounded-lg bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] px-3.5 py-1.5 text-xs font-semibold text-[#999999] hover:text-white transition active:scale-95"
                >
                  Archive
                </button>
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
      {/* Edit Category Lightbox - Redesigned to match website palette, icon color picker, expanded icons */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setEditingCategory(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#333333] bg-[#141414] p-6 sm:p-7 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#262626]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/10 text-white border border-white/20">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-oughter text-base font-bold text-white tracking-tight">Customize Category</h3>
                  <p className="text-[11px] text-[#6B6B6B]">Personalize name, color accent, and iconic symbol</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-[#6B6B6B] hover:text-white hover:bg-[#262626] transition"
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

              {/* Accent Color Chooser */}
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
                        className={`group relative flex items-center justify-center h-6 w-6 rounded-full border transition-all active:scale-95 ${isSelected ? 'border-white scale-125 shadow-[0_0_12px_rgba(255,255,255,0.35)]' : 'border-[#333333] hover:border-[#6B6B6B]'
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

              {/* Icon Selector Grid */}
              <div>
                <label className="text-xs font-medium text-[#D9D9D9] block mb-1.5">Icon Style</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                  {[
                    { label: 'Folder', icon: 'Folder' },
                    { label: 'Star', icon: 'Star' },
                    { label: 'Sparkles', icon: 'Sparkles' },
                    { label: 'Bookmark', icon: 'Bookmark' },
                    { label: 'Check', icon: 'BookmarkCheck' },
                    { label: 'Compass', icon: 'Compass' },
                    { label: 'Book', icon: 'BookOpen' },
                    { label: 'Tag', icon: 'Tag' },
                    { label: 'Code', icon: 'Code' },
                    { label: 'Music', icon: 'Music' },
                    { label: 'Camera', icon: 'Camera' },
                    { label: 'Coffee', icon: 'Coffee' },
                    { label: 'Heart', icon: 'Heart' },
                    { label: 'Briefcase', icon: 'Briefcase' },
                    { label: 'Flame', icon: 'Flame' },
                    { label: 'Globe', icon: 'Globe' },
                    { label: 'Fitness', icon: 'Dumbbell' },
                    { label: 'Idea', icon: 'Lightbulb' },
                    { label: 'Tech', icon: 'Cpu' },
                    { label: 'Learn', icon: 'GraduationCap' },
                    { label: 'Movie', icon: 'Film' },
                    { label: 'Gaming', icon: 'Gamepad2' },
                    { label: 'TV', icon: 'Tv' },
                    { label: 'Audio', icon: 'Headphones' },
                    { label: 'Design', icon: 'Palette' },
                    { label: 'Shop', icon: 'ShoppingBag' },
                    { label: 'Car', icon: 'Car' },
                    { label: 'Travel', icon: 'Plane' },
                    { label: 'Food', icon: 'Utensils' },
                    { label: 'Trophy', icon: 'Trophy' },
                    { label: 'Energy', icon: 'Zap' },
                    { label: 'Video', icon: 'Video' },
                    { label: 'Finance', icon: 'DollarSign' },
                    { label: 'Outdoors', icon: 'Mountain' },
                    { label: 'Nature', icon: 'Trees' },
                    { label: 'Security', icon: 'Shield' },
                    { label: 'Fun', icon: 'Smile' },
                    { label: 'News', icon: 'Newspaper' },
                    { label: 'Launch', icon: 'Rocket' },
                    { label: 'Tools', icon: 'Wrench' }
                  ].map(item => {
                    const isSelected = editCategoryIcon === item.icon;
                    const previewTheme = getCategoryTheme(item.icon, editCategoryColor);
                    return (
                      <button
                        key={item.icon}
                        type="button"
                        onClick={() => setEditCategoryIcon(item.icon)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition active:scale-95 ${isSelected
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
                  placeholder="What is saved in this folder (e.g. Italian pasta recipes, quick dinners)?"
                />
                <span className="text-[10px] text-[#6B6B6B] block mt-1">
                  This description preserves the category&apos;s purpose so content continues organizing here cleanly.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-xl border border-[#333333] bg-[#1A1A1A] hover:bg-[#262626] px-4 py-2 text-xs font-medium text-[#D9D9D9] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-white hover:bg-[#E5E5E5] text-black px-5 py-2 text-xs font-bold transition active:scale-95 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Apple Liquid Glass "How to Play" Game Guide for First-time Sign-in & New Accounts */}
      <GameOnboardingGuide
        isOpen={showGameGuide}
        onClose={dismissGameGuide}
        onComplete={dismissGameGuide}
      />
    </div>
  );
}
