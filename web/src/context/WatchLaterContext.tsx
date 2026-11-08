'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Reel, Category, Device, CompletionStatus } from '@/types/database';

export type NavPage = 'home' | 'all' | 'categories' | 'savelater' | 'saves' | 'watched' | 'inbox' | 'failed' | 'archived' | 'settings';
export type PostTypeFilter = 'all' | 'reels' | 'posts' | 'carousels';

export const isAllContentReel = (r: Reel) =>
  r.completion_status !== 'archived' && !r.is_failed && r.processing_status !== 'extraction_failed';

export const isInboxReel = (r: Reel) =>
  r.processing_status === 'pending' || r.processing_status === 'resolving';

interface WatchLaterContextType {
  session: any;
  setSession: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  refreshing: boolean;
  reels: Reel[];
  setReels: React.Dispatch<React.SetStateAction<Reel[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  savedLaterIds: string[];
  setSavedLaterIds: React.Dispatch<React.SetStateAction<string[]>>;
  pinnedFolderIds: string[];
  setPinnedFolderIds: React.Dispatch<React.SetStateAction<string[]>>;
  counts: {
    all: number;
    savelater: number;
    watched: number;
    inbox: number;
    failed: number;
    archived: number;
    categories: number;
  };
  rootCategories: Category[];
  pinnedCategories: Category[];
  savesFolderIds: string[];
  savesFolders: Category[];
  handleCreateSaveFolder: (name: string) => Promise<void>;
  toggleSaveReel: (reelId: string) => void;
  loadData: () => Promise<void>;
  incomingAlert: string | null;
  lastMoveAction: {
    type: 'reel' | 'folder';
    id: string;
    prevCatId: string | null;
    targetCatId: string | null;
    title: string;
  } | null;
  showIncomingAlert: (msg: string, isMoveAction?: boolean) => void;
  undoLastMove: () => Promise<void>;
  handleStatusChange: (reelId: string, status: CompletionStatus) => Promise<void>;
  handleDeleteReel: (reelId: string, e?: React.MouseEvent) => Promise<void>;
  handleRetryExtraction: (reelId: string) => Promise<void>;
  handleCreateCategory: (e: React.FormEvent) => Promise<void>;
  handleUpdateCategory: (e: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (catId: string, e?: React.MouseEvent) => Promise<void>;
  handleDropOnCategory: (targetCatId: string, e: React.DragEvent) => Promise<void>;
  togglePinFolder: (catId: string) => void;
  retryingId: string | null;
  density: 'extra-compact' | 'compact' | 'comfortable' | 'spacious' | 'extra-spacious';
  setDensity: (d: 'extra-compact' | 'compact' | 'comfortable' | 'spacious' | 'extra-spacious') => void;
  showThumbnails: boolean;
  setShowThumbnails: (s: boolean) => void;
  showPersonaInsights: boolean;
  setShowPersonaInsights: (s: boolean) => void;
  isFirstTimePersona: boolean;
  dismissFirstTimePersona: () => void;
  userPersonaInsight: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (s: boolean) => void;
  retentionPeriod: 'day' | 'week' | 'month';
  setRetentionPeriod: (p: 'day' | 'week' | 'month') => void;
  viewLayout: 'grid' | 'list';
  updateViewLayout: (v: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (f: boolean) => void;
  postTypeFilter: PostTypeFilter;
  setPostTypeFilter: (f: PostTypeFilter) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  activeCardMenuId: string | null;
  setActiveCardMenuId: (id: string | null) => void;
  draggedItem: any;
  setDraggedItem: (item: any) => void;
  dragOverCatId: string | null;
  setDragOverCatId: (id: string | null) => void;
  detailReelId: string | null;
  setDetailReelId: (id: string | null) => void;
  detailReel: Reel | undefined;
  editingCategory: Category | null;
  setEditingCategory: (cat: Category | null) => void;
  editCategoryName: string;
  setEditCategoryName: (name: string) => void;
  editCategoryIcon: string;
  setEditCategoryIcon: (icon: string) => void;
  editCategoryColor: string;
  setEditCategoryColor: (color: string) => void;
  editCategoryDesc: string;
  setEditCategoryDesc: (desc: string) => void;
  categoryMetaMap: Record<string, { icon?: string; color?: string; description?: string }>;
  showGameGuide: boolean;
  setShowGameGuide: (show: boolean) => void;
  handleCompleteGameGuide: () => void;
  showClearHistoryLightbox: boolean;
  setShowClearHistoryLightbox: (show: boolean) => void;
  isClearingHistory: boolean;
  clearCategoriesAlso: boolean;
  setClearCategoriesAlso: (clear: boolean) => void;
  handleConfirmClearHistory: () => Promise<void>;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  isCreatingCategory: boolean;
  setIsCreatingCategory: (creating: boolean) => void;
  categoryInsertPending: boolean;
  newPassword: string;
  setNewPassword: (p: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (s: boolean) => void;
  passwordMsg: string | null;
  handleChangePassword: (e: React.FormEvent) => Promise<void>;
  handleRemoveDevice: (deviceId: string) => Promise<void>;
  handleSyncDevice: (deviceId: string) => Promise<void>;
  exportData: () => void;
}

const WatchLaterContext = createContext<WatchLaterContextType | undefined>(undefined);

const CROSS_TAB_CHANNEL_NAME = 'watchlater_cross_tab_sync';

let crossTabChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    crossTabChannel = new BroadcastChannel(CROSS_TAB_CHANNEL_NAME);
  } catch (e) { }
}

let userRealtimeChannel: any = null;

// Track recently processed message IDs to prevent double execution across BroadcastChannel and Realtime
const processedMessageIds = new Set<string>();

const broadcastCrossDevice = (type: string, payload: any) => {
  const msgId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  processedMessageIds.add(msgId);
  // Keep deduplication set bounded
  if (processedMessageIds.size > 200) {
    const firstKey = processedMessageIds.values().next().value;
    if (firstKey) processedMessageIds.delete(firstKey);
  }

  // 1. Same-device instant tab-to-tab sync
  if (crossTabChannel) {
    try {
      crossTabChannel.postMessage({ type, payload, msgId });
    } catch (e) { }
  }
  // 2. Cross-device instant WebSocket sync via Supabase Realtime Broadcast
  if (userRealtimeChannel) {
    try {
      const res = userRealtimeChannel.send({
        type: 'broadcast',
        event: 'USER_SYNC',
        payload: { type, payload, msgId }
      });
      // Handle asynchronous send promises to prevent unhandled rejection
      if (res && typeof res.catch === 'function') {
        res.catch(() => { });
      }
    } catch (e) { }
  }
};

const broadcastCrossTab = (message: { type: string; payload?: any }) => {
  broadcastCrossDevice(message.type, message.payload);
};

export function WatchLaterProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selected category in Directory / drill-down
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [postTypeFilter, setPostTypeFilter] = useState<PostTypeFilter>('all');

  // Real-time toast arrival banner on dashboard
  const [incomingAlert, setIncomingAlert] = useState<string | null>(null);
  const [lastMoveAction, setLastMoveAction] = useState<{
    type: 'reel' | 'folder';
    id: string;
    prevCatId: string | null;
    targetCatId: string | null;
    title: string;
  } | null>(null);
  const incomingAlertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showIncomingAlert = useCallback((msg: string, isMoveAction: boolean = false) => {
    if (incomingAlertTimerRef.current) {
      clearTimeout(incomingAlertTimerRef.current);
    }
    if (!isMoveAction) {
      setLastMoveAction(null);
    }
    setIncomingAlert(msg);
    incomingAlertTimerRef.current = setTimeout(() => {
      setIncomingAlert(null);
      setLastMoveAction(null);
      incomingAlertTimerRef.current = null;
    }, 4500);
  }, []);

  const [reels, setReels] = useState<Reel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Track initial load completion and known reel IDs for incoming alert notifications
  const initialLoadCompletedRef = useRef(false);
  const knownReelIdsRef = useRef<Set<string>>(new Set());
  const alertedReelIdsRef = useRef<Set<string>>(new Set());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [detailReelId, setDetailReelId] = useState<string | null>(null);
  const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);

  const sessionRef = useRef<any>(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState<{ type: 'reel' | 'folder'; id: string; reelId?: string; folderId?: string } | null>(null);
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);

  // Pinned Folders in Sidebar
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);

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

  // Layout & Density
  const [density, setDensity] = useState<'extra-compact' | 'compact' | 'comfortable' | 'spacious' | 'extra-spacious'>('comfortable');
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showPersonaInsights, setShowPersonaInsights] = useState(true);
  const [isFirstTimePersona, setIsFirstTimePersona] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Interactive Walkthrough Guide Modal
  const [showGameGuide, setShowGameGuide] = useState(false);

  // Clear History / Database reset lightbox
  const [showClearHistoryLightbox, setShowClearHistoryLightbox] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [clearCategoriesAlso, setClearCategoriesAlso] = useState(false);

  // Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Helper to load user-scoped savedLaterIds
  const loadSavedLaterIdsForUser = useCallback((userId?: string): string[] => {
    if (!userId) return [];
    try {
      const stored = localStorage.getItem(`watchlater_saved_later_ids_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((id): id is string => typeof id === 'string');
      }
    } catch (e) { }
    return [];
  }, []);

  const [savedLaterIds, setSavedLaterIds] = useState<string[]>([]);

  // Toggle saving reel with cross-tab broadcast and localStorage sync
  const toggleSaveReel = useCallback((reelId: string) => {
    setSavedLaterIds(prev => {
      const isSaved = prev.includes(reelId);
      const next = isSaved ? prev.filter(id => id !== reelId) : [...prev, reelId];
      const userId = sessionRef.current?.user?.id;
      if (userId) {
        try {
          localStorage.setItem(`watchlater_saved_later_ids_${userId}`, JSON.stringify(next));
        } catch (e) { }
        broadcastCrossDevice('SAVES_CHANGE', { userId, savedLaterIds: next });
      }
      showIncomingAlert(isSaved ? 'Removed from Saves' : 'Saved to Saves vault ✓');
      return next;
    });
  }, [showIncomingAlert]);

  // Helper to load user-scoped savesFolderIds (separate from global AI categories)
  const loadSavesFolderIdsForUser = useCallback((userId?: string): string[] => {
    if (!userId) return [];
    try {
      const stored = localStorage.getItem(`watchlater_saves_folder_ids_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((id): id is string => typeof id === 'string');
      }
    } catch (e) { }
    return [];
  }, []);

  const [savesFolderIds, setSavesFolderIds] = useState<string[]>([]);

  // Load UI preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('watchlater_view_layout') as 'grid' | 'list';
      if (savedLayout === 'grid' || savedLayout === 'list') setViewLayout(savedLayout);

      const savedDensity = localStorage.getItem('watchlater_density') as any;
      if (savedDensity) setDensity(savedDensity);

      const savedThumbs = localStorage.getItem('watchlater_show_thumbnails');
      if (savedThumbs !== null) setShowThumbnails(savedThumbs === 'true');

      const savedPersona = localStorage.getItem('watchlater_show_persona');
      if (savedPersona !== null) setShowPersonaInsights(savedPersona === 'true');

      const savedSidebar = localStorage.getItem('watchlater_sidebar_collapsed');
      if (savedSidebar !== null) setSidebarCollapsed(savedSidebar === 'true');

      const savedRetention = localStorage.getItem('watchlater_archive_retention') as any;
      if (savedRetention) setRetentionPeriod(savedRetention);

      const savedPins = localStorage.getItem('watchlater_pinned_folders');
      if (savedPins) setPinnedFolderIds(JSON.parse(savedPins));

      const savedCatMeta = localStorage.getItem('watchlater_categories_meta');
      if (savedCatMeta) setCategoryMetaMap(JSON.parse(savedCatMeta));
    } catch (err) { }
  }, []);

  // Check Persona first-time status
  useEffect(() => {
    if (session?.user?.id) {
      const seen = localStorage.getItem(`watchlater_persona_celebrated_${session.user.id}`);
      if (!seen) {
        setIsFirstTimePersona(true);
      }
    }
  }, [session]);

  const dismissFirstTimePersona = () => {
    setIsFirstTimePersona(false);
    if (session?.user?.id) {
      localStorage.setItem(`watchlater_persona_celebrated_${session.user.id}`, 'true');
    }
  };

  const handleCompleteGameGuide = () => {
    setShowGameGuide(false);
    if (session?.user?.id) {
      localStorage.setItem(`watchlater_guide_completed_${session.user.id}`, 'true');
    }
  };

  // Category state reconciliation
  useEffect(() => {
    if (selectedCategoryId && !categories.some(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  // Persona Insight Calculation
  const userPersonaInsight = useMemo(() => {
    if (reels.length === 0) {
      return "Your vault is ready for ingestion. Share any Reel from your phone to start synthesizing your taste profile.";
    }
    const catCounts: Record<string, number> = {};
    reels.forEach(r => {
      const catName = categories.find(c => c.id === r.category_id)?.name || 'Inbox & Discovery';
      catCounts[catName] = (catCounts[catName] || 0) + 1;
    });
    const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const topNiche = sorted[0]?.[0] || 'Knowledge & Curations';
    const secondNiche = sorted[1]?.[0];

    if (secondNiche) {
      return `You are intensely drawn to ${topNiche} and ${secondNiche}. You curate high-value knowledge and trending media with laser focus.`;
    }
    return `Your vault leans heavily into ${topNiche}. Your focus signals a disciplined curation habit.`;
  }, [reels, categories]);

  const togglePinFolder = (catId: string) => {
    setPinnedFolderIds(prev => {
      const next = prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId];
      try {
        localStorage.setItem('watchlater_pinned_folders', JSON.stringify(next));
      } catch (e) { }
      broadcastCrossTab({ type: 'PINS_CHANGE', payload: { pinnedFolderIds: next } });
      return next;
    });
  };

  const updateViewLayout = (val: 'grid' | 'list') => {
    setViewLayout(val);
    try {
      localStorage.setItem('watchlater_view_layout', val);
    } catch (err) { }
    broadcastCrossTab({ type: 'VIEW_LAYOUT_CHANGE', payload: { layout: val } });
  };

  const updateDensity = (d: 'extra-compact' | 'compact' | 'comfortable' | 'spacious' | 'extra-spacious') => {
    setDensity(d);
    try {
      localStorage.setItem('watchlater_density', d);
    } catch (err) { }
    broadcastCrossTab({ type: 'DENSITY_CHANGE', payload: { density: d } });
  };

  const updateShowThumbnails = (s: boolean) => {
    setShowThumbnails(s);
    try {
      localStorage.setItem('watchlater_show_thumbnails', String(s));
    } catch (err) { }
    broadcastCrossTab({ type: 'THUMBNAILS_CHANGE', payload: { showThumbnails: s } });
  };

  const updateShowPersonaInsights = (s: boolean) => {
    setShowPersonaInsights(s);
    try {
      localStorage.setItem('watchlater_show_persona', String(s));
    } catch (err) { }
    broadcastCrossTab({ type: 'PERSONA_CHANGE', payload: { showPersonaInsights: s } });
  };

  const updateSidebarCollapsed = (s: boolean) => {
    setSidebarCollapsed(s);
    try {
      localStorage.setItem('watchlater_sidebar_collapsed', String(s));
    } catch (err) { }
    broadcastCrossTab({ type: 'SIDEBAR_CHANGE', payload: { sidebarCollapsed: s } });
  };

  const updateRetentionPeriod = (p: 'day' | 'week' | 'month') => {
    setRetentionPeriod(p);
    try {
      localStorage.setItem('watchlater_archive_retention', p);
    } catch (err) { }
    broadcastCrossTab({ type: 'RETENTION_CHANGE', payload: { retentionPeriod: p } });
  };

  // Main data loader
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user?.id) {
        if (!silent) setRefreshing(false);
        return;
      }
      const requestUserId = currentSession.user.id;

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
                extraction_error
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

      const fetchStartTime = Date.now();
      const reelsPromise = fetchAllReels();
      const catsPromise = supabase.from('categories').select('*').order('name');
      const devsPromise = supabase.from('devices').select('*').order('last_synced_at', { ascending: false });

      const [reelsRes, catsRes, devsRes] = await Promise.all([reelsPromise, catsPromise, devsPromise]);

      if (reelsRes.error) console.error('Error fetching reels:', reelsRes.error);
      if (catsRes.error) console.error('Error fetching categories:', catsRes.error);
      if (devsRes.error) console.error('Error fetching devices:', devsRes.error);

      const { data: { session: latestSession } } = await supabase.auth.getSession();
      if (latestSession?.user?.id === requestUserId) {
        if (reelsRes.data) {
          const fetchedReels = reelsRes.data as Reel[];
          const fetchedIds = new Set(fetchedReels.map(r => r.id));

          // If initial load was already completed, detect new incoming reels
          if (initialLoadCompletedRef.current) {
            const newlyArrived = fetchedReels.filter(r => !knownReelIdsRef.current.has(r.id) && !alertedReelIdsRef.current.has(r.id));
            if (newlyArrived.length > 0) {
              const latestNew = newlyArrived[0];
              alertedReelIdsRef.current.add(latestNew.id);
              showIncomingAlert(`Incoming Reel: "${latestNew.ai_title || latestNew.caption || 'New Reel'}" arrived in vault ✓`);
            }
          } else {
            initialLoadCompletedRef.current = true;
          }

          // Update known IDs ref
          fetchedReels.forEach(r => knownReelIdsRef.current.add(r.id));

          setReels(prevReels => {
            const recentNewReels = prevReels.filter(r => {
              if (fetchedIds.has(r.id)) return false;
              const createdMs = new Date(r.created_at).getTime();
              return !isNaN(createdMs) && createdMs >= fetchStartTime;
            });
            return [...recentNewReels, ...fetchedReels];
          });

          if (!reelsRes.error) {
            setSavedLaterIds(prevSaved => prevSaved.filter(id => typeof id === 'string' && fetchedIds.has(id)));
          }
        }
        if (catsRes.data) {
          const fetchedCats = catsRes.data as Category[];
          setCategories(fetchedCats);
          // Auto-reconcile Saves folders from database rows where is_system is true
          const dbSavesFolderIds = fetchedCats.filter(c => c.is_system).map(c => c.id);
          if (dbSavesFolderIds.length > 0) {
            setSavesFolderIds(prev => Array.from(new Set([...prev, ...dbSavesFolderIds])));
          }
        }
        if (devsRes.data) setDevices(devsRes.data as Device[]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [showIncomingAlert]);

  // Undo Last Move
  const undoLastMove = useCallback(async () => {
    if (!lastMoveAction) return;
    const action = lastMoveAction;
    setLastMoveAction(null);
    setIncomingAlert(null);

    if (action.type === 'reel') {
      setReels(prev => prev.map(r => r.id === action.id ? { ...r, category_id: action.prevCatId } : r));
      const { error } = await supabase.from('reels').update({ category_id: action.prevCatId }).eq('id', action.id);
      if (error) {
        alert(`Failed to undo move: ${error.message}`);
        await loadData();
      } else {
        broadcastCrossDevice('REEL_UPDATE', { reelId: action.id, categoryId: action.prevCatId });
        showIncomingAlert(`Undone! Returned reel to previous folder ✓`);
      }
    } else if (action.type === 'folder') {
      setCategories(prev => prev.map(c => c.id === action.id ? { ...c, parent_id: action.prevCatId } : c));
      const { error } = await supabase.from('categories').update({ parent_id: action.prevCatId }).eq('id', action.id);
      if (error) {
        alert(`Failed to undo nesting: ${error.message}`);
        await loadData();
      } else {
        showIncomingAlert(`Undone! Restored folder hierarchy ✓`);
      }
    }
  }, [lastMoveAction, showIncomingAlert, loadData]);

  // Auth initialization
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
        initialLoadCompletedRef.current = false;
        knownReelIdsRef.current.clear();
        alertedReelIdsRef.current.clear();
        setReels([]);
        setCategories([]);
        setDevices([]);
        setSavedLaterIds([]);
        setSavesFolderIds([]);
      } else if (nextUserId !== prevUserId) {
        initialLoadCompletedRef.current = false;
        knownReelIdsRef.current.clear();
        alertedReelIdsRef.current.clear();
        setReels([]);
        setCategories([]);
        setDevices([]);
        setSavedLaterIds(loadSavedLaterIdsForUser(nextUserId));
        setSavesFolderIds(loadSavesFolderIdsForUser(nextUserId));
      }

      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadSavedLaterIdsForUser, loadSavesFolderIdsForUser]);

  // Initial load of savesFolderIds when session is ready
  useEffect(() => {
    if (session?.user?.id) {
      setSavesFolderIds(loadSavesFolderIdsForUser(session.user.id));
    }
  }, [session?.user?.id, loadSavesFolderIdsForUser]);

  // Persist savedLaterIds tied to active user
  useEffect(() => {
    const currentUserId = session?.user?.id;
    if (currentUserId && !loading) {
      try {
        localStorage.setItem(`watchlater_saved_later_ids_${currentUserId}`, JSON.stringify(savedLaterIds));
      } catch (e) { }
    }
  }, [savedLaterIds, session?.user?.id, loading]);

  // Persist savesFolderIds tied to active user
  useEffect(() => {
    const currentUserId = session?.user?.id;
    if (currentUserId && !loading) {
      try {
        localStorage.setItem(`watchlater_saves_folder_ids_${currentUserId}`, JSON.stringify(savesFolderIds));
      } catch (e) { }
    }
  }, [savesFolderIds, session?.user?.id, loading]);

  // Cross-Tab Synchronization Effect (BroadcastChannel + storage event)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(CROSS_TAB_CHANNEL_NAME);
        bc.onmessage = (event) => {
          const { type, payload, msgId } = event.data || {};
          if (!type) return;

          // Deduplicate if already handled
          if (msgId) {
            if (processedMessageIds.has(msgId)) return;
            processedMessageIds.add(msgId);
          }

          const currentUserId = sessionRef.current?.user?.id;

          switch (type) {
            case 'SAVES_CHANGE':
              if (payload?.userId === currentUserId && Array.isArray(payload?.savedLaterIds)) {
                setSavedLaterIds(payload.savedLaterIds);
              }
              break;
            case 'SAVES_FOLDERS_CHANGE':
              if (payload?.userId === currentUserId && Array.isArray(payload?.savesFolderIds)) {
                setSavesFolderIds(payload.savesFolderIds);
              }
              break;
            case 'PINS_CHANGE':
              if (Array.isArray(payload?.pinnedFolderIds)) {
                setPinnedFolderIds(payload.pinnedFolderIds);
              }
              break;
            case 'CATEGORY_META_CHANGE':
              if (payload?.meta) {
                setCategoryMetaMap(payload.meta);
              }
              break;
            case 'VIEW_LAYOUT_CHANGE':
              if (payload?.layout) {
                setViewLayout(payload.layout);
              }
              break;
            case 'DENSITY_CHANGE':
              if (payload?.density) {
                setDensity(payload.density);
              }
              break;
            case 'THUMBNAILS_CHANGE':
              if (payload?.showThumbnails !== undefined) {
                setShowThumbnails(payload.showThumbnails);
              }
              break;
            case 'PERSONA_CHANGE':
              if (payload?.showPersonaInsights !== undefined) {
                setShowPersonaInsights(payload.showPersonaInsights);
              }
              break;
            case 'SIDEBAR_CHANGE':
              if (payload?.sidebarCollapsed !== undefined) {
                setSidebarCollapsed(payload.sidebarCollapsed);
              }
              break;
            case 'RETENTION_CHANGE':
              if (payload?.retentionPeriod) {
                setRetentionPeriod(payload.retentionPeriod);
              }
              break;
            case 'REEL_UPDATE':
              if (payload?.reelId) {
                setReels(prev => prev.map(r => {
                  if (r.id !== payload.reelId) return r;
                  const updated = { ...r };
                  if (payload.status !== undefined) updated.completion_status = payload.status;
                  if (payload.categoryId !== undefined) updated.category_id = payload.categoryId;
                  return updated;
                }));
              }
              break;
            case 'CATEGORY_ADD':
              if (currentUserId && payload?.category?.user_id === currentUserId) {
                setCategories(prev => prev.some(c => c.id === payload.category.id) ? prev : [...prev, payload.category]);
              }
              break;
            case 'CATEGORY_UPDATE':
              if (currentUserId && payload?.categoryId && payload?.name && (!payload?.userId || payload.userId === currentUserId)) {
                setCategories(prev => prev.map(c => c.id === payload.categoryId ? { ...c, name: payload.name } : c));
              }
              break;
            case 'CATEGORY_DELETE':
              if (currentUserId && payload?.categoryId && (!payload?.userId || payload.userId === currentUserId)) {
                setCategories(prev => prev.filter(c => c.id !== payload.categoryId));
              }
              break;
            case 'REEL_DELETE':
              if (payload?.reelId) {
                setReels(prev => prev.filter(r => r.id !== payload.reelId));
                setSavedLaterIds(prev => prev.filter(id => id !== payload.reelId));
              }
              break;
            case 'DATA_REFRESH':
              loadData();
              break;
          }
        };
      } catch (e) { }
    }

    // Window storage event (fires in other open tabs when localStorage changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.newValue === null) return;
      const currentUserId = sessionRef.current?.user?.id;

      try {
        if (currentUserId && e.key === `watchlater_saved_later_ids_${currentUserId}`) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSavedLaterIds(parsed);
        } else if (currentUserId && e.key === `watchlater_saves_folder_ids_${currentUserId}`) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSavesFolderIds(parsed);
        } else if (e.key === 'watchlater_pinned_folders') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPinnedFolderIds(parsed);
        } else if (e.key === 'watchlater_categories_meta') {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') setCategoryMetaMap(parsed);
        } else if (e.key === 'watchlater_view_layout') {
          if (e.newValue === 'grid' || e.newValue === 'list') setViewLayout(e.newValue);
        } else if (e.key === 'watchlater_density') {
          if (e.newValue === 'compact' || e.newValue === 'comfortable' || e.newValue === 'spacious') {
            setDensity(e.newValue as any);
          }
        } else if (e.key === 'watchlater_show_thumbnails') {
          setShowThumbnails(e.newValue === 'true');
        } else if (e.key === 'watchlater_show_persona') {
          setShowPersonaInsights(e.newValue === 'true');
        } else if (e.key === 'watchlater_sidebar_collapsed') {
          setSidebarCollapsed(e.newValue === 'true');
        } else if (e.key === 'watchlater_archive_retention') {
          setRetentionPeriod(e.newValue as any);
        }
      } catch (err) { }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  // Real-time synchronization & Cross-Device Broadcast Sync
  const currentUserId = session?.user?.id;
  useEffect(() => {
    if (currentUserId) {
      loadData();

      const channel = supabase
        .channel(`realtime_all_changes_${currentUserId}`, {
          config: {
            broadcast: { self: false }
          }
        })
        .on(
          'broadcast',
          { event: 'USER_SYNC' },
          (eventPayload) => {
            const { type, payload, msgId } = eventPayload.payload || {};
            if (!type) return;

            // Deduplicate if already handled via BroadcastChannel on the same machine
            if (msgId) {
              if (processedMessageIds.has(msgId)) return;
              processedMessageIds.add(msgId);
            }

            switch (type) {
              case 'SAVES_CHANGE':
                if (payload?.userId === currentUserId && Array.isArray(payload?.savedLaterIds)) {
                  setSavedLaterIds(payload.savedLaterIds);
                  try {
                    localStorage.setItem(`watchlater_saved_later_ids_${currentUserId}`, JSON.stringify(payload.savedLaterIds));
                  } catch (e) { }
                }
                break;
              case 'SAVES_FOLDERS_CHANGE':
                if (payload?.userId === currentUserId && Array.isArray(payload?.savesFolderIds)) {
                  setSavesFolderIds(payload.savesFolderIds);
                  try {
                    localStorage.setItem(`watchlater_saves_folder_ids_${currentUserId}`, JSON.stringify(payload.savesFolderIds));
                  } catch (e) { }
                }
                break;
              case 'PINS_CHANGE':
                if (Array.isArray(payload?.pinnedFolderIds)) {
                  setPinnedFolderIds(payload.pinnedFolderIds);
                  try {
                    localStorage.setItem('watchlater_pinned_folders', JSON.stringify(payload.pinnedFolderIds));
                  } catch (e) { }
                }
                break;
              case 'CATEGORY_META_CHANGE':
                if (payload?.meta) {
                  setCategoryMetaMap(payload.meta);
                  try {
                    localStorage.setItem('watchlater_categories_meta', JSON.stringify(payload.meta));
                  } catch (e) { }
                }
                break;
              case 'REEL_UPDATE':
                if (payload?.reelId) {
                  setReels(prev => prev.map(r => {
                    if (r.id !== payload.reelId) return r;
                    const updated = { ...r };
                    if (payload.status !== undefined) updated.completion_status = payload.status;
                    if (payload.categoryId !== undefined) updated.category_id = payload.categoryId;
                    return updated;
                  }));
                }
                break;
              case 'CATEGORY_ADD':
                if (currentUserId && payload?.category?.user_id === currentUserId) {
                  setCategories(prev => prev.some(c => c.id === payload.category.id) ? prev : [...prev, payload.category]);
                }
                break;
              case 'CATEGORY_UPDATE':
                if (currentUserId && payload?.categoryId && payload?.name && (!payload?.userId || payload.userId === currentUserId)) {
                  setCategories(prev => prev.map(c => c.id === payload.categoryId ? { ...c, name: payload.name } : c));
                }
                break;
              case 'CATEGORY_DELETE':
                if (currentUserId && payload?.categoryId && (!payload?.userId || payload.userId === currentUserId)) {
                  setCategories(prev => prev.filter(c => c.id !== payload.categoryId));
                }
                break;
              case 'REEL_DELETE':
                if (payload?.reelId) {
                  setReels(prev => prev.filter(r => r.id !== payload.reelId));
                  setSavedLaterIds(prev => prev.filter(id => id !== payload.reelId));
                }
                break;
              case 'DATA_REFRESH':
                loadData();
                break;
            }
          }
        )
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
              knownReelIdsRef.current.add(newReel.id);
              if (!alertedReelIdsRef.current.has(newReel.id)) {
                alertedReelIdsRef.current.add(newReel.id);
                showIncomingAlert(`Incoming Reel: "${newReel.ai_title || newReel.caption || 'New Reel'}" arrived in vault ✓`);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedReel = payload.new as Reel;
              setReels((prev) =>
                prev.map((reel) => (reel.id === updatedReel.id ? { ...reel, ...updatedReel } : reel))
              );
            } else if (payload.eventType === 'DELETE') {
              setReels((prev) => prev.filter((reel) => reel.id !== payload.old.id));
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
              if (newCat.is_system) {
                setSavesFolderIds((prev) => prev.includes(newCat.id) ? prev : [...prev, newCat.id]);
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id?: string }).id;
              setCategories((prev) => prev.filter(c => c.id !== deletedId));
              if (deletedId) {
                setSavesFolderIds((prev) => prev.filter(id => id !== deletedId));
              }
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
                return [newDev, ...prev];
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id?: string }).id;
              setDevices((prev) => prev.filter(d => d.id !== deletedId));
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Device;
              setDevices((prev) => prev.map(d => d.id === updated.id ? updated : d));
            }
          }
        )
        .subscribe();

      userRealtimeChannel = channel;

      // Active 4-second sync buffer: checks for incoming reels and device connection status without manual page refresh
      const bufferInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          loadData(true);
        }
      }, 4000);

      return () => {
        clearInterval(bufferInterval);
        userRealtimeChannel = null;
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, loadData, showIncomingAlert]);

  // Archive Auto-Delete retention window runner
  useEffect(() => {
    if (!session || reels.length === 0) return;

    const checkAndPurgeArchived = async () => {
      const now = Date.now();
      const cutoffMap: Record<string, number> = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      };
      const maxAgeMs = cutoffMap[retentionPeriod] || cutoffMap.month;

      const toPurge = reels.filter(r => {
        if (r.completion_status !== 'archived') return false;
        if (!r.completed_at) return false;
        const archiveTime = new Date(r.completed_at).getTime();
        if (isNaN(archiveTime)) return false;
        return now - archiveTime > maxAgeMs;
      });

      if (toPurge.length > 0) {
        const ids = toPurge.map(r => r.id);
        const { error } = await supabase.from('reels').delete().in('id', ids);
        if (!error) {
          setReels(prev => prev.filter(r => !ids.includes(r.id)));
        }
      }
    };

    checkAndPurgeArchived();
  }, [reels, retentionPeriod, session]);

  // Action Handlers
  const handleStatusChange = async (reelId: string, status: CompletionStatus) => {
    const timestamp = status === 'completed' || status === 'archived' ? new Date().toISOString() : null;
    setReels(prev => prev.map(r => r.id === reelId ? {
      ...r,
      completion_status: status,
      completed_at: timestamp
    } : r));

    broadcastCrossTab({ type: 'REEL_UPDATE', payload: { reelId, status } });

    const { error } = await supabase
      .from('reels')
      .update({
        completion_status: status,
        completed_at: timestamp
      })
      .eq('id', reelId);

    if (error) {
      alert(`Failed to update status: ${error.message}`);
      await loadData();
    }
  };

  const handleDeleteReel = async (reelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this reel?')) return;

    setReels(prev => prev.filter(r => r.id !== reelId));
    setSavedLaterIds(prev => prev.filter(id => id !== reelId));

    broadcastCrossTab({ type: 'REEL_DELETE', payload: { reelId } });

    const { error } = await supabase.from('reels').delete().eq('id', reelId);
    if (error) {
      alert(`Failed to delete reel: ${error.message}`);
      await loadData();
    }
  };

  const handleRetryExtraction = async (reelId: string) => {
    setRetryingId(reelId);
    try {
      const targetReel = reels.find(r => r.id === reelId);
      if (!targetReel) return;

      const { error: delErr } = await supabase
        .from('extracted_content')
        .delete()
        .eq('reel_id', reelId);

      if (delErr) {
        alert(`Failed to clear extraction data: ${delErr.message}`);
        return;
      }

      const { error: updateErr } = await supabase
        .from('reels')
        .update({
          processing_status: 'pending',
          is_failed: false
        })
        .eq('id', reelId);

      if (updateErr) {
        alert(`Failed to reset status: ${updateErr.message}`);
        await loadData();
        return;
      }

      broadcastCrossTab({ type: 'DATA_REFRESH' });
      await loadData();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const persistCategoryMeta = (updatedMap: Record<string, { icon?: string; color?: string; description?: string }>) => {
    setCategoryMetaMap(updatedMap);
    try {
      localStorage.setItem('watchlater_categories_meta', JSON.stringify(updatedMap));
    } catch (e) { }
    broadcastCrossTab({ type: 'CATEGORY_META_CHANGE', payload: { meta: updatedMap } });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed || !session?.user?.id) return;

    setCategoryInsertPending(true);
    try {
      const isDuplicate = categories.some(
        c => c.name.toLowerCase() === trimmed.toLowerCase() && (c.parent_id || null) === (categoryParentId || null)
      );
      if (isDuplicate) {
        alert('A category with this name already exists in this level.');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: trimmed,
          user_id: session.user.id,
          parent_id: categoryParentId || null
        })
        .select()
        .single();

      if (error) {
        alert(`Error creating category: ${error.message}`);
        return;
      }

      if (data) {
        const createdCat = data as Category;
        setCategories(prev => prev.some(c => c.id === createdCat.id) ? prev : [...prev, createdCat]);
        setNewCategoryName('');
        setIsCreatingCategory(false);
        setCategoryParentId(null);
        broadcastCrossDevice('CATEGORY_ADD', { category: createdCat });
        broadcastCrossTab({ type: 'DATA_REFRESH' });
      }
    } finally {
      setCategoryInsertPending(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    const trimmed = editCategoryName.trim();
    const { error } = await supabase
      .from('categories')
      .update({ name: trimmed })
      .eq('id', editingCategory.id);

    if (error) {
      alert(`Error updating folder: ${error.message}`);
      return;
    }

    const updatedMeta = {
      ...categoryMetaMap,
      [editingCategory.id]: {
        icon: editCategoryIcon,
        color: editCategoryColor,
        description: editCategoryDesc.trim()
      }
    };
    persistCategoryMeta(updatedMeta);

    setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: trimmed } : c));
    setEditingCategory(null);
    broadcastCrossDevice('CATEGORY_UPDATE', { userId: session?.user?.id, categoryId: editingCategory.id, name: trimmed });
    broadcastCrossTab({ type: 'DATA_REFRESH' });
  };

  const handleDeleteCategory = async (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    if (!confirm(`Permanently delete folder "${cat.name}"? Saved reels will remain intact as uncategorized.`)) return;

    const initiatingUserId = sessionRef.current?.user?.id;
    const previousCategories = [...categories];
    const previousSavesFolderIds = [...savesFolderIds];

    // Optimistically remove immediately from local state
    setCategories(prev => prev.filter(c => c.id !== catId));
    if (selectedCategoryId === catId) setSelectedCategoryId(null);
    if (savesFolderIds.includes(catId)) {
      setSavesFolderIds(prev => {
        const next = prev.filter(id => id !== catId);
        if (session?.user?.id) {
          try {
            localStorage.setItem(`watchlater_saves_folder_ids_${session.user.id}`, JSON.stringify(next));
          } catch (e) { }
        }
        return next;
      });
    }

    // Step 1: Nullify parent_id for any nested children so foreign key constraints or queries don't revert
    await supabase.from('categories').update({ parent_id: null }).eq('parent_id', catId);
    // Step 2: Unlink any reels mapped to this category so they safely become uncategorized
    await supabase.from('reels').update({ category_id: null }).eq('category_id', catId);
    await supabase.from('reels').update({ subcategory_id: null }).eq('subcategory_id', catId);

    // Step 3: Delete the category record itself
    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) {
      alert(`Failed to delete folder: ${error.message}`);
      if (initiatingUserId && sessionRef.current?.user?.id === initiatingUserId) {
        setCategories(previousCategories);
        setSavesFolderIds(previousSavesFolderIds);
      }
      await loadData();
    } else {
      broadcastCrossDevice('CATEGORY_DELETE', { userId: session?.user?.id, categoryId: catId });
      if (savesFolderIds.includes(catId) && session?.user?.id) {
        const next = savesFolderIds.filter(id => id !== catId);
        broadcastCrossDevice('SAVES_FOLDERS_CHANGE', { userId: session.user.id, savesFolderIds: next });
      }
      broadcastCrossTab({ type: 'DATA_REFRESH' });
    }
  };

  const handleCreateSaveFolder = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const userId = session?.user?.id;
    if (!userId) {
      alert('You must be signed in to create a folder.');
      return;
    }

    setCategoryInsertPending(true);
    try {
      const isDuplicate = categories.some(
        c => c.name.toLowerCase() === trimmed.toLowerCase() && savesFolderIds.includes(c.id)
      );
      if (isDuplicate) {
        alert('A folder with this name already exists in Saves.');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: trimmed,
          user_id: userId,
          parent_id: null,
          is_system: true
        })
        .select()
        .single();

      if (error) {
        alert(`Error creating folder: ${error.message}`);
        return;
      }

      if (data) {
        const createdCat = data as Category;
        setCategories(prev => prev.some(c => c.id === createdCat.id) ? prev : [...prev, createdCat]);
        broadcastCrossDevice('CATEGORY_ADD', { category: createdCat });
        setSavesFolderIds(prev => {
          const next = prev.includes(createdCat.id) ? prev : [...prev, createdCat.id];
          try {
            localStorage.setItem(`watchlater_saves_folder_ids_${userId}`, JSON.stringify(next));
          } catch (e) { }
          broadcastCrossDevice('SAVES_FOLDERS_CHANGE', { userId, savesFolderIds: next });
          return next;
        });
        showIncomingAlert(`Created Saves folder "${trimmed}" ✓`);
      }
    } finally {
      setCategoryInsertPending(false);
    }
  };

  // Drag-and-drop on category handler
  const handleDropOnCategory = async (targetCatId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCatId(null);

    let dragData = draggedItem;
    if (!dragData) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) dragData = JSON.parse(raw);
      } catch (err) { }
    }
    if (!dragData) return;

    const targetDbId = targetCatId === '__root__' ? null : targetCatId;
    const targetCat = targetDbId ? categories.find(c => c.id === targetDbId) : null;

    if (dragData.type === 'reel') {
      const reelId = dragData.reelId || dragData.id;
      const reelObj = reels.find(r => r.id === reelId);
      const prevCatId = reelObj?.category_id || null;

      if (prevCatId === targetDbId) return;

      setReels(prev => prev.map(r => r.id === reelId ? { ...r, category_id: targetDbId } : r));
      broadcastCrossDevice('REEL_UPDATE', { reelId, categoryId: targetDbId });
      setLastMoveAction({
        type: 'reel',
        id: reelId,
        prevCatId,
        targetCatId: targetDbId,
        title: targetDbId ? (targetCat?.name || 'Folder') : 'Root'
      });

      const { error } = await supabase
        .from('reels')
        .update({ category_id: targetDbId })
        .eq('id', reelId);

      if (error) {
        alert(`Failed to move reel: ${error.message}`);
        await loadData();
      } else {
        showIncomingAlert(targetDbId ? `Moved reel into "${targetCat?.name || 'Folder'}" ✓` : 'Removed reel from folder ✓', true);
      }
    } else if (dragData.type === 'folder') {
      const folderId = dragData.folderId || dragData.id;
      if (folderId === targetDbId) {
        setDraggedItem(null);
        return;
      }

      // Cycle prevention
      if (targetDbId) {
        let cur = categories.find(c => c.id === targetDbId);
        let isDescendant = false;
        while (cur && cur.parent_id) {
          if (cur.parent_id === folderId) {
            isDescendant = true;
            break;
          }
          cur = categories.find(c => c.id === cur?.parent_id);
        }
        if (isDescendant) {
          alert('Cannot nest a parent folder inside its own descendant.');
          setDraggedItem(null);
          return;
        }
      }

      const folderObj = categories.find(c => c.id === folderId);
      const prevCatId = folderObj?.parent_id || null;
      if (prevCatId === targetDbId) return;

      setCategories(prev => prev.map(c => c.id === folderId ? { ...c, parent_id: targetDbId } : c));
      setLastMoveAction({
        type: 'folder',
        id: folderId,
        prevCatId,
        targetCatId: targetDbId,
        title: targetDbId ? (targetCat?.name || 'Folder') : 'Root'
      });

      const { error } = await supabase
        .from('categories')
        .update({ parent_id: targetDbId })
        .eq('id', folderId);

      if (error) {
        alert(`Failed to nest folder: ${error.message}`);
        await loadData();
      } else {
        showIncomingAlert(targetDbId ? `Nested folder inside "${targetCat?.name || 'Folder'}" ✓` : 'Moved folder to root level ✓', true);
      }
    }

    broadcastCrossTab({ type: 'DATA_REFRESH' });
    setDraggedItem(null);
  };

  const handleConfirmClearHistory = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    setIsClearingHistory(true);
    try {
      if (clearCategoriesAlso) {
        const { error: catErr } = await supabase.from('categories').delete().eq('user_id', userId);
        if (catErr) throw catErr;
        setCategories([]);
        setSelectedCategoryId(null);
      }
      const { error: reelErr } = await supabase.from('reels').delete().eq('user_id', userId);
      if (reelErr) throw reelErr;

      setReels([]);
      setSavedLaterIds([]);
      setShowClearHistoryLightbox(false);
      broadcastCrossTab({ type: 'DATA_REFRESH' });
      await loadData();
    } catch (err: any) {
      alert(`Clear failed: ${err.message || err}`);
      await loadData();
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    setPasswordMsg('Updating password...');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg(`Error: ${error.message}`);
    } else {
      setPasswordMsg('Password updated successfully!');
      setNewPassword('');
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Remove this device synchronization node?')) return;
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    const { error } = await supabase.from('devices').delete().eq('id', deviceId);
    if (error) {
      alert(`Error removing device: ${error.message}`);
      await loadData();
    }
  };

  const handleSyncDevice = async (deviceId: string) => {
    const now = new Date().toISOString();
    setDevices(prev => prev.map(d => (d.id === deviceId ? { ...d, last_synced_at: now } : d)));
    const { error } = await supabase
      .from('devices')
      .update({ last_synced_at: now })
      .eq('id', deviceId);
    if (error) {
      alert(`Error syncing device: ${error.message}`);
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
      sanitizeCell(r.ai_title || r.caption),
      sanitizeCell(r.creator_username),
      sanitizeCell(r.completion_status),
      sanitizeCell(r.created_at)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watch-later-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rootCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id && !savesFolderIds.includes(c.id));
  }, [categories, savesFolderIds]);

  const savesFolders = useMemo(() => {
    return categories.filter(c => savesFolderIds.includes(c.id));
  }, [categories, savesFolderIds]);

  const pinnedCategories = useMemo(() => {
    return categories.filter(c => pinnedFolderIds.includes(c.id));
  }, [categories, pinnedFolderIds]);

  const detailReel = useMemo(() => {
    return reels.find(r => r.id === detailReelId);
  }, [reels, detailReelId]);

  const counts = useMemo(() => {
    const all = reels.filter(isAllContentReel).length;
    const savelater = reels.filter(r => savedLaterIds.includes(r.id)).length;
    const watched = reels.filter(r => r.completion_status === 'completed').length;
    const inbox = reels.filter(isInboxReel).length;
    const failed = reels.filter(r => r.is_failed || r.processing_status === 'extraction_failed').length;
    const archived = reels.filter(r => r.completion_status === 'archived').length;
    const categoriesCount = categories.filter(c => !savesFolderIds.includes(c.id)).length;

    return { all, savelater, watched, inbox, failed, archived, categories: categoriesCount };
  }, [reels, savedLaterIds, categories, savesFolderIds]);

  const value: WatchLaterContextType = {
    session,
    setSession,
    loading,
    refreshing,
    reels,
    setReels,
    categories,
    setCategories,
    devices,
    setDevices,
    savedLaterIds,
    setSavedLaterIds,
    pinnedFolderIds,
    setPinnedFolderIds,
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
    showIncomingAlert,
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
    setDensity: updateDensity,
    showThumbnails,
    setShowThumbnails: updateShowThumbnails,
    showPersonaInsights,
    setShowPersonaInsights: updateShowPersonaInsights,
    isFirstTimePersona,
    dismissFirstTimePersona,
    userPersonaInsight,
    sidebarCollapsed,
    setSidebarCollapsed: updateSidebarCollapsed,
    retentionPeriod,
    setRetentionPeriod: updateRetentionPeriod,
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
    handleSyncDevice,
    exportData
  };

  return (
    <WatchLaterContext.Provider value={value}>
      {children}
    </WatchLaterContext.Provider>
  );
}

export function useWatchLater() {
  const context = useContext(WatchLaterContext);
  if (!context) {
    throw new Error('useWatchLater must be used within a WatchLaterProvider');
  }
  return context;
}
