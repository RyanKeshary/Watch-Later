const { createClient } = require('@supabase/supabase-js');
const instatouch = require('instatouch');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zxiddkgigvyejlcgahof.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const INSTAGRAM_SESSION_ID = process.env.INSTAGRAM_SESSION_ID || '';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);

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

/**
 * Extracts shortcode from an Instagram URL.
 * e.g., https://www.instagram.com/reel/DfXCRvJBGWN/ -> DfXCRvJBGWN
 */
function extractShortcode(url) {
  const match = url.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Fallback metadata resolver using public OpenGraph headers when unauthenticated
 * scraper endpoints are blocked/login-gated by Instagram's web UI.
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
    throw new Error(`OpenGraph HTTP error: ${res.status}`);
  }

  const html = await res.text();

  const metaDescMatch = html.match(/<meta\s+(?:property="og:description"|name="description")\s+content="([^"]+)"/i) 
                     || html.match(/content="([^"]+)"\s+(?:property="og:description"|name="description")/i);

  const metaImgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
                    || html.match(/content="([^"]+)"\s+property="og:image"/i);

  let rawDesc = metaDescMatch ? decodeHtmlEntities(metaDescMatch[1]) : '';
  let thumbnail = metaImgMatch ? decodeHtmlEntities(metaImgMatch[1]) : '';

  let creator = null;
  let caption = rawDesc;

  // Instagram formats og:description as:
  // "25K likes, 167 comments - <username> on <date>: \"<caption>\"."
  const parsed = rawDesc.match(/-\s*([A-Za-z0-9_.]+)\s+(?:on|shared a post)[^:]*:\s*["“](.*)["”]/s);
  if (parsed) {
    creator = parsed[1];
    caption = parsed[2];
  }

  if (!caption && !thumbnail) {
    throw new Error("Unable to retrieve post data or metadata from Instagram");
  }

  return {
    caption: caption || rawDesc,
    creator_username: creator,
    thumbnail_url: thumbnail,
    video_url: '',
    raw: { source: 'opengraph_fallback', raw_desc: rawDesc }
  };
}

/**
 * Executes instagram-scraper (instatouch) with fallback to OpenGraph metadata.
 */
async function extractInstagramData(url) {
  const shortcode = extractShortcode(url);
  if (!shortcode) {
    throw new Error(`Invalid Instagram URL: ${url}`);
  }

  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  const options = {
    count: 1,
    mediaType: 'all',
    session: INSTAGRAM_SESSION_ID ? [INSTAGRAM_SESSION_ID] : [],
    timeout: 10000,
  };

  try {
    // 1. Primary: instatouch (drawrowfly/instagram-scraper)
    if (typeof instatouch.getPostMeta === 'function') {
      const meta = await instatouch.getPostMeta(postUrl, options);
      if (meta && (meta.description || meta.text || meta.edge_media_to_caption || meta.display_url)) {
        return {
          caption: meta.description || meta.text || (meta.edge_media_to_caption && meta.edge_media_to_caption.edges[0]?.node?.text) || '',
          creator_username: meta.owner?.username || meta.username || '',
          thumbnail_url: meta.display_url || meta.thumbnail_src || '',
          video_url: meta.video_url || '',
          raw: meta
        };
      }
    }
  } catch (scraperErr) {
    console.warn(`[Worker] instagram-scraper encountered error: ${scraperErr.message}. Attempting metadata fallback...`);
  }

  // 2. Fallback: Parse Instagram public crawler metadata
  return await extractViaOpenGraph(url);
}

/**
 * Runs Groq AI categorization if caption / text is available.
 */
async function categorizeWithGroq(caption, existingCategories) {
  if (!GROQ_API_KEY || !caption || caption.trim().length === 0) {
    return null;
  }

  const systemPrompt = `You are an expert content categorization engine for Instagram Reels.
Analyze the caption thoroughly to determine the exact subject matter and assign deep hierarchical categorization (Primary Category, Subcategory, and Specific Topic).

Return strictly a valid JSON object matching this schema:
{
  "category": string (broad domain: e.g. "Software & Tech", "Fitness & Health", "Film & TV", "Finance & Investing", "Comedy & Humor", "Design & Creative", "Self-Improvement"),
  "subcategory": string (specific subgenre: e.g. "Web Development", "Strength Training", "Sitcoms", "Personal Finance", "Sketch Comedy", "UI/UX"),
  "topic": string (laser-focused subject: e.g. "React State Management", "Squat Form", "Young Sheldon Sequels", "Budgeting Tips"),
  "tags": string[] (3-6 precise keywords),
  "difficulty": "Beginner" | "Intermediate" | "Advanced" | "General",
  "ai_title": string (catchy, informative headline, max 65 chars),
  "ai_description": string (clear summary of context and main takeaway, 1-2 sentences),
  "ai_summary": string (actionable bulleted or concise breakdown, 2-3 sentences),
  "confidence": number (between 0.0 and 1.0)
}

Whenever an existing category from this list accurately fits, reuse it:
Existing categories: ${JSON.stringify(existingCategories || [])}
`;

  const userPrompt = `Reel Caption:\n"""\n${caption}\n"""`;

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
      console.warn(`[Groq] API request failed (${response.status}): ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    return JSON.parse(content);
  } catch (err) {
    console.warn('[Groq] Categorization error:', err.message);
    return null;
  }
}

/**
 * Process a single pending Reel.
 */
async function processReel(reel) {
  console.log(`[Worker] Processing reel ID: ${reel.id} (${reel.url})`);

  // Update status to resolving
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

  // Handle Extraction Failure (Section 1.8 & 7.6)
  if (extractionError || !extractionData) {
    console.log(`[Worker] Moving reel ${reel.id} to Failed system folder.`);
    
    // Save to extracted_content
    await supabase.from('extracted_content').upsert({
      reel_id: reel.id,
      extraction_status: 'failed',
      extraction_error: extractionError,
      extracted_at: new Date().toISOString()
    }, { onConflict: 'reel_id' });

    // Update reel
    await supabase
      .from('reels')
      .update({
        processing_status: 'extraction_failed',
        is_failed: true
      })
      .eq('id', reel.id);

    return;
  }

  // Extraction Succeeded
  const caption = extractionData.caption || null;
  const creator = extractionData.creator_username || null;
  const thumbnail = extractionData.thumbnail_url || null;

  // Save extracted content
  await supabase.from('extracted_content').upsert({
    reel_id: reel.id,
    transcript: null,
    raw_scraper_output: extractionData.raw,
    extraction_status: 'success',
    extracted_at: new Date().toISOString()
  }, { onConflict: 'reel_id' });

  // Fetch user's existing categories for Groq context
  const { data: userCategories } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', reel.user_id);

  const existingCategoryNames = (userCategories || []).map(c => c.name);

  // Run AI Categorization if caption is present
  const aiResult = await categorizeWithGroq(caption, existingCategoryNames);

  let categoryId = null;
  let subcategoryId = null;
  let processingStatus = 'partially_processed';

  if (aiResult) {
    if (aiResult.confidence >= 0.6 && aiResult.category) {
      // Find or create category
      let { data: catRow } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', reel.user_id)
        .ilike('name', aiResult.category)
        .maybeSingle();

      if (!catRow) {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({ user_id: reel.user_id, name: aiResult.category })
          .select('id')
          .single();
        catRow = newCat;
      }
      categoryId = catRow?.id || null;

      // Find or create subcategory if present
      if (aiResult.subcategory && categoryId) {
        let { data: subRow } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', reel.user_id)
          .eq('parent_id', categoryId)
          .ilike('name', aiResult.subcategory)
          .maybeSingle();

        if (!subRow) {
          const { data: newSub } = await supabase
            .from('categories')
            .insert({ user_id: reel.user_id, name: aiResult.subcategory, parent_id: categoryId })
            .select('id')
            .single();
          subRow = newSub;
        }
        subcategoryId = subRow?.id || null;
      }

      processingStatus = 'processed';
    } else {
      // Low confidence routes to Uncategorized folder
      processingStatus = 'partially_processed';
    }
  }

  // Update Reel with parsed metadata and AI classification
  await supabase
    .from('reels')
    .update({
      creator_username: creator,
      caption: caption,
      thumbnail_url: thumbnail,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      ai_title: aiResult?.ai_title || (caption ? (caption.length > 50 ? caption.substring(0, 47) + '...' : caption) : null),
      ai_description: aiResult?.ai_description || null,
      ai_summary: aiResult?.ai_summary || null,
      difficulty: aiResult?.difficulty || null,
      processing_status: processingStatus,
      is_failed: false
    })
    .eq('id', reel.id);

  console.log(`[Worker] Reel ${reel.id} processing finished. Status: ${processingStatus}`);
}

/**
 * Main polling worker loop.
 */
async function runLoop() {
  console.log('[Worker] ReelVault Background Worker running. Polling for pending reels...');

  while (true) {
    try {
      const { data: pendingReels, error } = await supabase
        .from('reels')
        .select('*')
        .eq('processing_status', 'pending')
        .limit(5);

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
