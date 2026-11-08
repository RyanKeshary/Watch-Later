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

  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!res.ok) {
    throw new Error('Unable to access Instagram post (network or privacy restricted)');
  }

  const html = await res.text();

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
  const image = rawImage ? decodeHtmlEntities(rawImage) : null;

  let creator = null;
  if (rawTitle) {
    const creatorMatch = rawTitle.match(/@([a-zA-Z0-9._]+)/);
    if (creatorMatch) creator = creatorMatch[1];
  }
  if (!creator && rawDesc) {
    const creatorMatch = rawDesc.match(/([a-zA-Z0-9._]+)\s+on\s+[A-Za-z]+\s+\d+/i);
    if (creatorMatch) creator = creatorMatch[1];
  }

  let caption = rawDesc;
  const quoteMatch = rawDesc.match(/:\s*["“](.*?)["”]\s*$/s);
  if (quoteMatch) {
    caption = quoteMatch[1];
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
Your task is to organize user social saves into a clean, intuitive flat taxonomy with high-quality, strict parent categories.
Do NOT generate or use subcategories.

STRUCTURING RULES:
1. ALWAYS inspect existing categories first:
${JSON.stringify(categoriesContext, null, 2)}
2. CATEGORIES:
- If this post fits into an existing category, ALWAYS reuse that category name (e.g. if "Food & Cooking" exists, do not create "Cooking" or "Recipes").
- If no existing category fits, create ONE high-level category name (e.g. "Food & Cooking", "Tech & AI", "Fitness", "Design & Art", "Comedy").
3. DO NOT create subcategories under any circumstances. Keep categories clean, focused, and distinct.
4. DO NOT create duplicate or synonymous categories.

Return strictly a valid JSON object matching this schema:
{
  "category": string (domain category name - reuse existing whenever possible),
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

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      console.warn(`[Groq] API error (${response.status}): ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content);
  } catch (err) {
    console.warn('[Groq] Categorization error:', err.message);
    return null;
  }
}

async function processReel(reel) {
  console.log(`[Worker] Processing reel ID: ${reel.id} (${reel.url})`);

  await supabase
    .from('reels')
    .update({ processing_status: 'resolving' })
    .eq('id', reel.id);

  let extractionData = null;
  let extractionError = null;

  try {
    extractionData = await extractInstagramData(reel.url);
  } catch (err) {
    extractionError = err.message || String(err);
    console.error(`[Worker] Extraction failed for ${reel.id}:`, extractionError);
  }

  if (extractionError || !extractionData) {
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

  await supabase
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

  console.log(`[Worker] Reel ${reel.id} processing finished. Status: ${processingStatus}`);

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
        if (usedIds.has(cat.id)) return false;
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

async function runLoop() {
  console.log('[Worker] Watch Later Background Worker running. Polling for pending reels...');
  await cleanupEmptyCategories();

  while (true) {
    try {
      const { data: pendingReels, error } = await supabase
        .from('reels')
        .select('*')
        .eq('processing_status', 'pending')
        .limit(10);

      if (error) {
        console.error('[Worker] Error fetching pending reels:', error.message);
      } else if (pendingReels && pendingReels.length > 0) {
        for (const reel of pendingReels) {
          await processReel(reel);
        }
      }
    } catch (loopErr) {
      console.error('[Worker] Loop cycle error:', loopErr);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

const http = require('http');

// Simple health-check HTTP server so Render Free Tier Web Service keeps running
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'watch-later-worker', uptime: process.uptime() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Worker] Health check HTTP server listening on port ${PORT}`);
});

runLoop();
