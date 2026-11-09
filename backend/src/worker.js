const { createClient } = require('@supabase/supabase-js');
const instatouch = require('instatouch');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zxiddkgigvyejlcgahof.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const INSTAGRAM_SESSION_ID = process.env.INSTAGRAM_SESSION_ID || '';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '1000', 10);

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Worker] Fatal: SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractShortcode(url) {
  const match = url.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Fallback metadata resolver using public OpenGraph headers
 */
async function extractViaOpenGraph(url) {
  const shortcode = extractShortcode(url);
  const isPost = /\/p\/[A-Za-z0-9_-]+/i.test(url);
  const targetUrl = shortcode
    ? (isPost ? `https://www.instagram.com/p/${shortcode}/` : `https://www.instagram.com/reel/${shortcode}/`)
    : url;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), INSTAGRAM_TIMEOUT_MS);

  let res;
  let html;
  try {
    res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!res.ok) {
      throw new Error('Unable to access Instagram post (network or privacy restricted)');
    }

    html = await res.text();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`OpenGraph metadata fetch timed out after ${INSTAGRAM_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  function extractMetaProperty(htmlContent, propertyName) {
    const metaTagRegex = /<meta\s+(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
    let match;
    let firstFoundContent = null;
    while ((match = metaTagRegex.exec(htmlContent)) !== null) {
      const tag = match[0];
      const propMatch = tag.match(new RegExp(`(?:property|name)=(["'])${propertyName}\\1`, 'i'));
      if (propMatch) {
        const contentMatch = tag.match(/content=(["'])([\s\S]*?)\1/i);
        if (contentMatch && contentMatch[2]) {
          const decodedValue = decodeHtmlEntities(contentMatch[2]);
          if (decodedValue.trim().length > 0) {
            return contentMatch[2];
          }
        }
        if (contentMatch && firstFoundContent === null) {
          firstFoundContent = contentMatch[2];
        }
      }
    }
    return firstFoundContent;
  }

  const rawTitle = decodeHtmlEntities(extractMetaProperty(html, 'og:title') || '');
  const rawDesc = decodeHtmlEntities(extractMetaProperty(html, 'og:description') || extractMetaProperty(html, 'description') || '');
  const rawImage = extractMetaProperty(html, 'og:image');
  const rawUrl = extractMetaProperty(html, 'og:url') || '';
  const image = rawImage ? decodeHtmlEntities(rawImage) : null;

  let creator = null;
  if (rawUrl) {
    const urlCreatorMatch = rawUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)\/(?:reel|p)\//i);
    if (urlCreatorMatch && urlCreatorMatch[1] !== 'p' && urlCreatorMatch[1] !== 'reel' && urlCreatorMatch[1] !== 'reels') {
      creator = urlCreatorMatch[1];
    }
  }
  if (!creator && rawTitle) {
    const creatorMatch = rawTitle.match(/@([a-zA-Z0-9._]+)/);
    if (creatorMatch) creator = creatorMatch[1];
  }
  if (!creator && rawDesc) {
    const creatorMatch = rawDesc.match(/([a-zA-Z0-9._]+)\s+on\s+[A-Za-z]+\s+\d+/i);
    if (creatorMatch) creator = creatorMatch[1];
  }

  let caption = rawDesc;
  // If rawTitle contains a quoted post caption, that is often the cleanest text
  const titleQuoteMatch = rawTitle.match(/:\s*["“](.*?)["”]\s*$/s);
  if (titleQuoteMatch && titleQuoteMatch[1].trim()) {
    caption = titleQuoteMatch[1].trim();
  } else {
    const quoteMatch = rawDesc.match(/:\s*["“](.*?)["”]\s*$/s);
    if (quoteMatch && quoteMatch[1].trim()) {
      caption = quoteMatch[1].trim();
    } else {
      // Remove trailing " - @creator on Date" metadata suffix attached to og:description
      caption = rawDesc.replace(/\s*-\s*@[a-zA-Z0-9._]+\s+on\s+[A-Za-z]+\s+\d+.*$/i, '').trim();
    }
  }

  // Extract hashtags and mentions from caption and descriptions
  const allText = `${rawTitle || ''} ${rawDesc || ''}`;
  const hashtags = Array.from(new Set(allText.match(/#[a-zA-Z0-9_]+/g) || []));
  const mentions = Array.from(new Set(allText.match(/@[a-zA-Z0-9._]+/g) || []));

  if (!caption && !rawDesc && !rawTitle) {
    throw new Error('Instagram post details could not be retrieved');
  }

  return {
    caption: caption || rawDesc || rawTitle || null,
    creator_username: creator || null,
    thumbnail_url: image || null,
    hashtags: hashtags,
    mentions: mentions,
    raw: {
      source: 'opengraph_fallback',
      raw_title: rawTitle,
      raw_desc: rawDesc,
      hashtags: hashtags,
      mentions: mentions
    }
  };
}

async function extractInstagramData(url) {
  const shortcode = extractShortcode(url);
  if (!shortcode) {
    throw new Error(`Invalid Instagram link format`);
  }

  const isPost = /\/p\/[A-Za-z0-9_-]+/i.test(url);
  const postUrl = isPost ? `https://www.instagram.com/p/${shortcode}/` : `https://www.instagram.com/reel/${shortcode}/`;

  try {
    const options = {
      count: 1,
      mediaType: 'all',
      timeout: 12000
    };
    if (INSTAGRAM_SESSION_ID) {
      options.session = `sessionid=${INSTAGRAM_SESSION_ID}`;
    }

    const data = await instatouch.getPostMeta(postUrl, options);
    if (data && data.graphql && data.graphql.shortcode_media) {
      const media = data.graphql.shortcode_media;
      const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || null;
      const creator = media.owner?.username || null;
      const thumbnail = media.display_url || null;

      return {
        caption,
        creator_username: creator,
        thumbnail_url: thumbnail,
        raw: media
      };
    }
  } catch (err) {
    // Instatouch failed (scraper rate limit or session missing) - silent fallback to OpenGraph
  }

  return await extractViaOpenGraph(url);
}

async function categorizeWithGroq(metadata, existingCategoryTree) {
  if (!GROQ_API_KEY) return null;

  const categoriesContext = (existingCategoryTree || []).map(cat => cat.name);

  const systemPrompt = `You are an expert AI content classifier and taxonomist.
Your task is to classify social media posts into an accurate, high-level primary domain category and generate metadata.
Do NOT generate or use subcategories. Keep categories clean, focused, and distinct.

STANDARD PRIMARY DOMAINS (Use these high-level parent categories when applicable):
- "Gaming": Video games, gameplay, game launchers, mods, esports, gaming clips, consoles (e.g. Minecraft, Roblox, GTA, PlayStation, Xbox, Steam, Fortnite). NEVER classify video games as "Tech & AI".
- "Tech & AI": Artificial intelligence, LLMs, machine learning, software tools, hardware, gadgets, tech news.
- "Coding & Dev": Programming languages, web development, algorithms, software engineering, databases, DevOps.
- "Design & Art": UI/UX, graphic design, 3D art, illustration, animation, architecture, interior design.
- "Business & Finance": Investing, entrepreneurship, startups, personal finance, real estate, crypto.
- "Food & Cooking": Recipes, restaurants, baking, cooking techniques, culinary reviews.
- "Fitness & Health": Workouts, gym, bodybuilding, nutrition, wellness, mental health.
- "Entertainment & Comedy": Skits, humor, memes, movies, TV shows, celebrity culture.
- "Education & Science": Academic topics, science explanations, history, philosophy, life hacks.

STRUCTURING RULES:
1. EXISTING CATEGORIES:
${JSON.stringify(categoriesContext, null, 2)}
- ONLY reuse an existing category if it is a genuinely accurate semantic match for the post content.
- CRITICAL: DO NOT force a post into an existing category if it belongs to a completely different domain (e.g. video games, Minecraft, game launchers belong in "Gaming", NEVER in "Tech & AI" or "Design & Art").
- If no existing category fits, create ONE high-level parent category name (e.g. "Gaming", "Food & Cooking", "Fitness & Health").
2. DO NOT create subcategories under any circumstances.
3. DO NOT create duplicate or synonymous categories.

Return strictly a valid JSON object matching this schema:
{
  "category": string (accurate primary category name - reuse existing ONLY when truly matching),
  "topic": string (laser-focused topic),
  "tags": string[] (3-6 precise keywords),
  "ai_title": string (engaging, informative headline, max 65 chars),
  "ai_description": string (clear 1-2 sentence overview),
  "ai_summary": string (actionable bulleted breakdown, 2-3 points),
  "confidence": number (between 0.0 and 1.0)
}`;

  const userPrompt = `Reel Details:
- Caption: """${metadata.caption || ''}"""
- Creator: @${metadata.creator_username || 'unknown'}
- Hashtags: ${metadata.hashtags?.join(' ') || 'none'}
- Mentions: ${metadata.mentions?.join(' ') || 'none'}
- Raw Description/Context: """${metadata.raw?.raw_desc || ''}"""`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      clearTimeout(timeoutId);
      console.warn(`[Groq] API error (${response.status}): ${errText}`);
      return null;
    }

    const data = await response.json();
    clearTimeout(timeoutId);
    return JSON.parse(data.choices[0]?.message?.content);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[Groq] AI classification timed out after ${GROQ_TIMEOUT_MS}ms`);
    } else {
      console.warn('[Groq] Categorization error:', err.message);
    }
    return null;
  }
}

async function processReel(reel) {
  const startTime = Date.now();
  console.log(`[Worker] Attempting to claim reel ID: ${reel.id} (${reel.url})`);

  // Atomic claim: verify processing_status is still 'pending' to prevent multi-worker race conditions
  const { data: claimed, error: claimErr } = await supabase
    .from('reels')
    .update({ processing_status: 'resolving' })
    .eq('id', reel.id)
    .eq('processing_status', 'pending')
    .select('id');

  if (claimErr || !claimed || claimed.length === 0) {
    // Another worker instance claimed this reel first
    return;
  }

  activeJobClaimTimes.set(reel.id, Date.now());

  let extractionData = null;
  let extractionError = null;

  try {
    extractionData = await extractInstagramData(reel.url);
  } catch (err) {
    extractionError = err.message || String(err);
    console.error(`[Worker] Extraction failed for ${reel.id}:`, extractionError);
  }

  if (extractionError || !extractionData) {
    workerMetrics.failedCount++;
    workerMetrics.lastJobDurationMs = Date.now() - startTime;
    await supabase.from('extracted_content').upsert({
      reel_id: reel.id,
      extraction_status: 'failed',
      extraction_error: extractionError,
      extracted_at: new Date().toISOString()
    }, { onConflict: 'reel_id' });

    await supabase
      .from('reels')
      .update({
        processing_status: 'extraction_failed',
        is_failed: true
      })
      .eq('id', reel.id);

    return;
  }

  const caption = extractionData.caption || null;
  const creator = extractionData.creator_username || null;
  const thumbnail = extractionData.thumbnail_url || null;

  await supabase.from('extracted_content').upsert({
    reel_id: reel.id,
    raw_scraper_output: extractionData.raw,
    extraction_status: 'success',
    extracted_at: new Date().toISOString()
  }, { onConflict: 'reel_id' });

  // Fetch full category hierarchy for context
  const { data: userCategories } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .eq('user_id', reel.user_id);

  const rootCategories = (userCategories || []).filter(c => !c.parent_id);

  // Deep categorization with full metadata and existing categories (strictly no subcategories)
  const aiResult = await categorizeWithGroq(extractionData, rootCategories);

  let categoryId = null;
  let subcategoryId = null;
  let processingStatus = 'partially_processed';

  const validCategory = (typeof aiResult?.category === 'string') ? aiResult.category.trim() : '';

  const escapeIlike = (str) => str.replace(/[%_\\]/g, '\\$&');

  if (validCategory && validCategory.toLowerCase() !== 'general') {
    // Top-level Category
    try {
      const { data: catRow, error: catSelectErr } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', reel.user_id)
        .is('parent_id', null)
        .ilike('name', escapeIlike(validCategory))
        .maybeSingle();

      if (catSelectErr) {
        console.error(`[Worker] Error selecting category "${validCategory}":`, catSelectErr);
      }

      let resolvedCat = catRow;
      if (!resolvedCat && !catSelectErr) {
        const { data: newCat, error: catInsertErr } = await supabase
          .from('categories')
          .insert({ user_id: reel.user_id, name: validCategory, parent_id: null })
          .select('id')
          .single();
        if (catInsertErr) {
          console.error(`[Worker] Error inserting category "${validCategory}":`, catInsertErr);
        } else {
          resolvedCat = newCat;
        }
      }
      categoryId = resolvedCat?.id || null;

      if (categoryId) {
        processingStatus = 'processed';
      }
    } catch (err) {
      console.error('[Worker] Category resolution unexpected error:', err);
    }
  }

  const { error: updateErr } = await supabase
    .from('reels')
    .update({
      creator_username: creator,
      caption: caption,
      thumbnail_url: thumbnail,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      ai_title: aiResult?.ai_title || (caption ? (caption.length > 50 ? caption.substring(0, 47) + '...' : caption) : 'Instagram Post'),
      ai_description: aiResult?.ai_description || null,
      ai_summary: aiResult?.ai_summary || null,
      difficulty: null, // complexity removed as requested
      processing_status: processingStatus,
      is_failed: false
    })
    .eq('id', reel.id);

  if (updateErr) {
    workerMetrics.failedCount++;
    workerMetrics.lastJobDurationMs = Date.now() - startTime;
    console.error(`[Worker] Reel ${reel.id} update error:`, updateErr.message);
    return;
  }

  workerMetrics.processedCount++;
  workerMetrics.lastJobDurationMs = Date.now() - startTime;
  console.log(`[Worker] Reel ${reel.id} processing finished in ${workerMetrics.lastJobDurationMs}ms. Status: ${processingStatus}`);

  // Clean up any empty categories for this user
  try {
    // Paginate categories to ensure all rows are fetched
    let allUserCats = [];
    let catFrom = 0;
    const catPageSize = 1000;
    let hasMoreCats = true;
    while (hasMoreCats) {
      const { data: page, error: catErr } = await supabase
        .from('categories')
        .select('id, parent_id, created_at')
        .eq('user_id', reel.user_id)
        .order('id', { ascending: true })
        .range(catFrom, catFrom + catPageSize - 1);

      if (catErr) {
        throw new Error(`Failed to fetch categories page: ${catErr.message}`);
      }
      if (page && page.length > 0) {
        allUserCats.push(...page);
        catFrom += catPageSize;
        if (page.length < catPageSize) hasMoreCats = false;
      } else {
        hasMoreCats = false;
      }
    }

    // Paginate reels to ensure all rows are fetched
    let allUserReels = [];
    let reelFrom = 0;
    const reelPageSize = 1000;
    let hasMoreReels = true;
    while (hasMoreReels) {
      const { data: page, error: reelErr } = await supabase
        .from('reels')
        .select('id, category_id, subcategory_id')
        .eq('user_id', reel.user_id)
        .order('id', { ascending: true })
        .range(reelFrom, reelFrom + reelPageSize - 1);

      if (reelErr) {
        throw new Error(`Failed to fetch reels page: ${reelErr.message}`);
      }
      if (page && page.length > 0) {
        allUserReels.push(...page);
        reelFrom += reelPageSize;
        if (page.length < reelPageSize) hasMoreReels = false;
      } else {
        hasMoreReels = false;
      }
    }

    if (allUserCats.length > 0) {
      const usedIds = new Set();
      for (const r of allUserReels) {
        if (r.category_id) usedIds.add(r.category_id);
        if (r.subcategory_id) usedIds.add(r.subcategory_id);
      }

      // Safeguard: protect manually/recently created categories (created in the last 15 minutes)
      const now = Date.now();
      const recentGracePeriodMs = 15 * 60 * 1000;

      // Find all categories protected by recent grace period, plus their parent IDs
      const protectedRecentParentIds = new Set();
      for (const cat of allUserCats) {
        if (cat.created_at && (now - new Date(cat.created_at).getTime()) < recentGracePeriodMs) {
          if (cat.parent_id) {
            protectedRecentParentIds.add(cat.parent_id);
          }
        }
      }

      const emptyIds = allUserCats.filter(cat => {
        if (cat.is_system) return false;
        if (usedIds.has(cat.id)) return false;
        if (cat.created_at && (now - new Date(cat.created_at).getTime()) < recentGracePeriodMs) {
          return false;
        }
        if (protectedRecentParentIds.has(cat.id)) {
          return false;
        }
        const hasChildWithReel = allUserCats.some(sub => sub.parent_id === cat.id && usedIds.has(sub.id));
        return !hasChildWithReel;
      }).map(c => c.id);

      if (emptyIds.length > 0) {
        const { error: delErr } = await supabase.from('categories').delete().in('id', emptyIds);
        if (delErr) {
          console.error(`[Worker] Error deleting empty categories:`, delErr.message);
        } else {
          console.log(`[Worker] Cleaned up ${emptyIds.length} empty categories for user ${reel.user_id}`);
        }
      }
    }
  } catch (cleanErr) {
    console.warn('[Worker] Empty category cleanup warning:', cleanErr.message);
  }
}

async function cleanupEmptyCategories() {
  try {
    // Paginate categories deterministically
    let allCats = [];
    let catFrom = 0;
    const catPageSize = 1000;
    let hasMoreCats = true;
    while (hasMoreCats) {
      const { data: page, error: catErr } = await supabase
        .from('categories')
        .select('id, parent_id, created_at')
        .order('id', { ascending: true })
        .range(catFrom, catFrom + catPageSize - 1);

      if (catErr) {
        console.error('[Worker] Startup cleanup failed fetching categories:', catErr.message);
        return;
      }
      if (page && page.length > 0) {
        allCats.push(...page);
        catFrom += catPageSize;
        if (page.length < catPageSize) hasMoreCats = false;
      } else {
        hasMoreCats = false;
      }
    }

    // Paginate reels deterministically
    let allReels = [];
    let reelFrom = 0;
    const reelPageSize = 1000;
    let hasMoreReels = true;
    while (hasMoreReels) {
      const { data: page, error: reelErr } = await supabase
        .from('reels')
        .select('id, category_id, subcategory_id')
        .order('id', { ascending: true })
        .range(reelFrom, reelFrom + reelPageSize - 1);

      if (reelErr) {
        console.error('[Worker] Startup cleanup failed fetching reels:', reelErr.message);
        return;
      }
      if (page && page.length > 0) {
        allReels.push(...page);
        reelFrom += reelPageSize;
        if (page.length < reelPageSize) hasMoreReels = false;
      } else {
        hasMoreReels = false;
      }
    }

    if (allCats.length > 0) {
      const usedIds = new Set();
      for (const r of allReels) {
        if (r.category_id) usedIds.add(r.category_id);
        if (r.subcategory_id) usedIds.add(r.subcategory_id);
      }

      // Preserve 15-minute grace period for recently created categories
      const now = Date.now();
      const recentGracePeriodMs = 15 * 60 * 1000;

      const protectedRecentParentIds = new Set();
      for (const cat of allCats) {
        if (cat.created_at && (now - new Date(cat.created_at).getTime()) < recentGracePeriodMs) {
          if (cat.parent_id) {
            protectedRecentParentIds.add(cat.parent_id);
          }
        }
      }

      const emptyIds = allCats.filter(cat => {
        if (cat.is_system) return false;
        if (usedIds.has(cat.id)) return false;
        if (cat.created_at && (now - new Date(cat.created_at).getTime()) < recentGracePeriodMs) {
          return false;
        }
        if (protectedRecentParentIds.has(cat.id)) {
          return false;
        }
        const hasChildWithReel = allCats.some(sub => sub.parent_id === cat.id && usedIds.has(sub.id));
        return !hasChildWithReel;
      }).map(c => c.id);

      if (emptyIds.length > 0) {
        // Immediate verification against live reels in bounded chunks to prevent query overflow
        // UUIDs are 36 chars; 50 IDs duplicated across .or() (~3.8KB query string) stay well within URL limits (<8KB)
        const chunkSize = 50;
        const liveActiveIds = new Set();
        let chunkFailed = false;

        for (let i = 0; i < emptyIds.length; i += chunkSize) {
          const chunk = emptyIds.slice(i, i + chunkSize);
          const [catRes, subRes] = await Promise.all([
            supabase.from('reels').select('category_id').in('category_id', chunk),
            supabase.from('reels').select('subcategory_id').in('subcategory_id', chunk)
          ]);

          if (catRes.error || subRes.error) {
            console.error('[Worker] Startup live-reels check failed:', catRes.error?.message || subRes.error?.message);
            chunkFailed = true;
            break;
          }

          for (const r of catRes.data || []) {
            if (r.category_id) liveActiveIds.add(r.category_id);
          }
          for (const r of subRes.data || []) {
            if (r.subcategory_id) liveActiveIds.add(r.subcategory_id);
          }
        }

        if (!chunkFailed) {
          const confirmedEmptyIds = emptyIds.filter(id => !liveActiveIds.has(id));

          if (confirmedEmptyIds.length > 0) {
            const { error: delErr } = await supabase.from('categories').delete().in('id', confirmedEmptyIds);
            if (!delErr) {
              console.log(`[Worker] Startup cleanup removed ${confirmedEmptyIds.length} empty categories.`);
            } else {
              console.error(`[Worker] Error deleting empty categories during startup cleanup:`, delErr.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Worker] Startup cleanup warning:', err.message);
  }
}

// Worker configuration constants
const INSTAGRAM_TIMEOUT_MS = 12000;
const GROQ_TIMEOUT_MS = 8000;
const MAX_CONCURRENT_JOBS = 3;
const ABANDONED_JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// In-flight processing tracking for graceful shutdown and lease management
const activeJobPromises = new Set();
const activeJobClaimTimes = new Map();
let isShuttingDown = false;

// Worker metrics tracking
const workerMetrics = {
  startedAt: new Date().toISOString(),
  processedCount: 0,
  failedCount: 0,
  abandonedRecoveredCount: 0,
  lastJobDurationMs: 0
};

// Periodic recovery of jobs abandoned during worker crash
async function recoverAbandonedJobs() {
  try {
    const now = Date.now();

    // Query resolving reels to inspect claim times vs cutoff
    const { data: resolvingReels, error: fetchErr } = await supabase
      .from('reels')
      .select('id, created_at')
      .eq('processing_status', 'resolving');

    if (fetchErr) {
      console.warn('[Worker] Abandoned jobs fetch error:', fetchErr.message);
      return;
    }

    if (!resolvingReels || resolvingReels.length === 0) return;

    const abandonedIds = [];
    for (const reel of resolvingReels) {
      const claimTime = activeJobClaimTimes.get(reel.id);
      if (typeof claimTime === 'number') {
        if (now - claimTime >= ABANDONED_JOB_TIMEOUT_MS) {
          abandonedIds.push(reel.id);
        }
      } else {
        // Fall back to parsing created_at safely with Date.parse
        const createdMs = reel.created_at ? Date.parse(reel.created_at) : NaN;
        if (!isNaN(createdMs) && (now - createdMs >= ABANDONED_JOB_TIMEOUT_MS)) {
          abandonedIds.push(reel.id);
        }
      }
    }

    if (abandonedIds.length > 0) {
      const { data: recovered, error: updateErr } = await supabase
        .from('reels')
        .update({ processing_status: 'pending' })
        .in('id', abandonedIds)
        .eq('processing_status', 'resolving')
        .select('id');

      if (updateErr) {
        console.warn('[Worker] Abandoned jobs update error:', updateErr.message);
      } else if (recovered && recovered.length > 0) {
        for (const r of recovered) {
          activeJobClaimTimes.delete(r.id);
        }
        workerMetrics.abandonedRecoveredCount += recovered.length;
        console.log(`[Worker] Recovered ${recovered.length} abandoned reels back to 'pending'.`);
      }
    }
  } catch (err) {
    console.warn('[Worker] Abandoned recovery exception:', err.message);
  }
}

async function runLoop() {
  console.log('[Worker] Watch Later Background Worker running. Polling for pending reels...');
  await cleanupEmptyCategories();
  await recoverAbandonedJobs();

  let cycleCounter = 0;

  while (!isShuttingDown) {
    cycleCounter++;
    try {
      // Periodically check for and recover abandoned jobs every ~60 polling cycles
      if (cycleCounter % 60 === 0) {
        await recoverAbandonedJobs();
      }

      const { data: pendingReels, error } = await supabase
        .from('reels')
        .select('*')
        .eq('processing_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(MAX_CONCURRENT_JOBS);

      if (error) {
        console.error('[Worker] Error fetching pending reels:', error.message);
      } else if (pendingReels && pendingReels.length > 0 && !isShuttingDown) {
        // Process bounded concurrency in parallel with atomic row claims
        const promises = pendingReels.map(async (reel) => {
          const promise = processReel(reel);
          activeJobPromises.add(promise);
          try {
            await promise;
          } finally {
            activeJobPromises.delete(promise);
            activeJobClaimTimes.delete(reel.id);
          }
        });
        await Promise.allSettled(promises);
      }
    } catch (loopErr) {
      console.error('[Worker] Loop cycle error:', loopErr);
    }

    if (!isShuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  console.log('[Worker] Worker loop stopped cleanly.');
}

// Graceful shutdown handling
function handleGracefulShutdown(signal) {
  console.log(`[Worker] Received ${signal}. Initiating graceful shutdown...`);
  isShuttingDown = true;

  const shutdownTimeout = setTimeout(() => {
    console.error('[Worker] Graceful shutdown timed out after 15s. Forcing exit.');
    process.exit(1);
  }, 15000);

  Promise.allSettled(Array.from(activeJobPromises)).then(() => {
    clearTimeout(shutdownTimeout);
    console.log('[Worker] All active jobs finished. Closing HTTP server and exiting.');
    server.close(() => process.exit(0));
  });
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

const http = require('http');

const PORT = process.env.PORT || 10000;
const server = http.createServer(async (req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: isShuttingDown ? 'shutting_down' : 'ok',
      service: 'watch-later-worker',
      uptime: process.uptime(),
      metrics: workerMetrics,
      activeJobs: activeJobPromises.size
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Worker] Health check HTTP server listening on port ${PORT}`);
});

runLoop();
