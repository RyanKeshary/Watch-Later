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
  const targetUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/` : url;

  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!res.ok) {
    throw new Error(`OpenGraph fetch returned status ${res.status}`);
  }

  const html = await res.text();

  function extractMetaProperty(htmlContent, propertyName) {
    const metaTagRegex = /<meta\s+(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
    let match;
    while ((match = metaTagRegex.exec(htmlContent)) !== null) {
      const tag = match[0];
      const propMatch = tag.match(new RegExp(`property=(["'])${propertyName}\\1`, 'i'));
      if (propMatch) {
        const contentMatch = tag.match(/content=(["'])([\s\S]*?)\1/i);
        if (contentMatch) return contentMatch[2];
      }
    }
    return null;
  }

  const rawTitle = decodeHtmlEntities(extractMetaProperty(html, 'og:title') || '');
  const rawDesc = decodeHtmlEntities(extractMetaProperty(html, 'og:description') || '');
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

  if (!caption && !rawDesc) {
    throw new Error('OpenGraph fallback could not find caption or description text');
  }

  return {
    caption: caption || rawDesc || null,
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
    throw new Error(`Could not parse shortcode from URL: ${url}`);
  }

  const postUrl = `https://www.instagram.com/reel/${shortcode}/`;

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
    console.warn(`[Worker] instatouch direct fetch error: ${err.message}. Using metadata fallback.`);
  }

  return await extractViaOpenGraph(url);
}

async function categorizeWithGroq(metadata, existingCategoryTree) {
  if (!GROQ_API_KEY) return null;

  const categoriesContext = (existingCategoryTree || []).map(cat => ({
    name: cat.name,
    subcategories: (cat.subcategories || []).map(s => s.name)
  }));

  const systemPrompt = `You are an expert AI content classifier and taxonomist.
Your task is to structure user social saves efficiently into hierarchical categories.

IMPORTANT STRUCTURING RULES:
1. ALWAYS inspect the existing category hierarchy first:
${JSON.stringify(categoriesContext, null, 2)}
2. If this post belongs to an existing parent category, REUSE that category name exactly.
3. Only choose an existing subcategory if it is an exact fit, or suggest a new subcategory ONLY if the reel represents a distinct niche within that category. If the category has few items or the post fits broadly, you can leave subcategory empty ("").
4. If no existing category fits this post, create ONE appropriate parent category.
5. NEVER create duplicate categories or create a subcategory with the same name as a parent category.
6. DO NOT use vague labels like "General", "Misc", "Other".

Return strictly a valid JSON object matching this schema:
{
  "category": string (domain category name),
  "subcategory": string (subgenre niche, or "" if none needed),
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
  const categoryTree = rootCategories.map(parent => ({
    name: parent.name,
    subcategories: (userCategories || []).filter(c => c.parent_id === parent.id)
  }));

  // Deep categorization with full metadata and existing category tree
  const aiResult = await categorizeWithGroq(extractionData, categoryTree);

  let categoryId = null;
  let subcategoryId = null;
  let processingStatus = 'partially_processed';

  const validCategory = (typeof aiResult?.category === 'string') ? aiResult.category.trim() : '';
  const validSubcategory = (typeof aiResult?.subcategory === 'string') ? aiResult.subcategory.trim() : '';

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

      // Subcategory
      if (validSubcategory && categoryId) {
        const { data: subRow, error: subSelectErr } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', reel.user_id)
          .eq('parent_id', categoryId)
          .ilike('name', escapeIlike(validSubcategory))
          .maybeSingle();

        if (subSelectErr) {
          console.error(`[Worker] Error selecting subcategory "${validSubcategory}":`, subSelectErr);
        }

        let resolvedSub = subRow;
        if (!resolvedSub && !subSelectErr) {
          const { data: newSub, error: subInsertErr } = await supabase
            .from('categories')
            .insert({
              user_id: reel.user_id,
              name: validSubcategory,
              parent_id: categoryId
            })
            .select('id')
            .single();
          if (subInsertErr) {
            console.error(`[Worker] Error inserting subcategory "${validSubcategory}":`, subInsertErr);
          } else {
            resolvedSub = newSub;
          }
        }
        subcategoryId = resolvedSub?.id || null;
      }

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
        .select('category_id, subcategory_id')
        .eq('user_id', reel.user_id)
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

      const emptyIds = allUserCats.filter(cat => {
        if (usedIds.has(cat.id)) return false;
        if (cat.created_at && (now - new Date(cat.created_at).getTime()) < recentGracePeriodMs) {
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

async function runLoop() {
  console.log('[Worker] Watch Later Background Worker running. Polling for pending reels...');

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

runLoop();
