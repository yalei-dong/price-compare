import { NextRequest, NextResponse } from "next/server";
import { searchProductsReal, buildStoreDirectUrl } from "@/lib/price-service";
import { detectGeoFromRequest } from "@/lib/request-locale";

// POST /api/ai-deals
// Body: { prompt: string }
// Streams AI response back to the client as text/event-stream
// Provider cascade: Gemini → Groq → template fallback (always works)

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userPrompt: string = body.prompt?.trim();
  const cityOverride: string | undefined = body.city;
  const regionOverride: string | undefined = body.region;
  if (!userPrompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  // Detect user location for local store context
  let geo: { country: string; region?: string; city?: string } = { country: "US" };
  try {
    geo = await detectGeoFromRequest(request);
  } catch {
    // Geo detection failed — use defaults
  }

  // Apply client-side postal code override if provided
  if (cityOverride) {
    geo.city = cityOverride;
    if (regionOverride) geo.region = regionOverride;
  }

  const country = geo.country || "US";
  const city = geo.city || "";

  // Extract likely grocery search terms from the user's prompt
  const searchTerms = extractSearchTerms(userPrompt);

  // Fetch real prices for the extracted terms (up to 6 parallel searches)
  const priceData = await fetchPriceContext(searchTerms, country, geo);

  // Build the system prompt with real price data
  const systemPrompt = buildSystemPrompt(country, city, priceData);

  // --- Provider cascade: Gemini → Groq → template fallback ---
  const aiStream = await tryGeminiStream(systemPrompt, userPrompt)
    ?? await tryGroqStream(systemPrompt, userPrompt);

  if (aiStream) {
    return new Response(aiStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // All AI providers failed — generate a template-based response from price data
  console.log("All AI providers unavailable, using template fallback");
  const fallbackText = buildTemplateFallback(searchTerms, priceData, city, country);
  return streamText(fallbackText);
}

// ---------------------------------------------------------------------------
// AI Provider: Gemini (multi-key rotation)
// ---------------------------------------------------------------------------
async function tryGeminiStream(
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream | null> {
  const allKeys = (process.env.GEMINI_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (allKeys.length === 0) return null;

  const payload = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: 2048 },
  });

  const keyIndex = Math.floor(Math.random() * allKeys.length);
  let geminiRes: Response | null = null;

  for (let attempt = 0; attempt < allKeys.length; attempt++) {
    const key = allKeys[(keyIndex + attempt) % allKeys.length];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${key}`;
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (geminiRes.ok) break;
    if (geminiRes.status === 429 || geminiRes.status === 503) continue;
    break; // other error — don't retry
  }

  if (!geminiRes || !geminiRes.ok) {
    console.warn(`Gemini failed (${geminiRes?.status || "no response"})`);
    return null;
  }

  return pipeGeminiSSE(geminiRes);
}

function pipeGeminiSSE(geminiRes: Response): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = geminiRes.body?.getReader();
      if (!reader) { controller.close(); return; }
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const evt = JSON.parse(data);
              const text = evt.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) { console.error("Gemini stream error:", err); }
      finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

// ---------------------------------------------------------------------------
// AI Provider: Groq (OpenAI-compatible, free tier: 14,400 RPD)
// ---------------------------------------------------------------------------
async function tryGroqStream(
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream | null> {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey) return null;

  const payload = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2048,
    stream: true,
  });

  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: payload,
    });
  } catch (err) {
    console.warn("Groq fetch error:", err);
    return null;
  }

  if (!res.ok) {
    console.warn(`Groq failed (${res.status})`);
    return null;
  }

  return pipeOpenAISSE(res);
}

function pipeOpenAISSE(res: Response): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = res.body?.getReader();
      if (!reader) { controller.close(); return; }
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const evt = JSON.parse(data);
              const text = evt.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) { console.error("Groq stream error:", err); }
      finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Template fallback: always works, no AI needed
// ---------------------------------------------------------------------------
function buildTemplateFallback(
  terms: string[],
  priceData: string,
  city: string,
  country: string
): string {
  const location = city ? `${city}, ${country}` : country;
  const sections: string[] = [];

  sections.push(`## 🛒 Price Comparison${city ? ` — ${location}` : ""}\n`);

  // Parse priceData back into structured sections
  const blocks = priceData.split("\n\n---\n\n").filter(Boolean);
  for (const block of blocks) {
    if (block.includes("no data found") || block.includes("lookup failed")) continue;

    const lines = block.split("\n");
    const header = lines[0]; // e.g. "📦 Product Name (source: flipp)"
    const priceLines = lines.slice(1).filter((l) => l.trim().startsWith("- "));

    if (priceLines.length === 0) continue;

    sections.push(header);

    // Parse prices to find cheapest
    const prices: { store: string; price: number; line: string }[] = [];
    for (const pl of priceLines) {
      const match = pl.match(/-\s+(.+?):\s+\w+\s+\$?([\d.]+)/);
      if (match) {
        prices.push({ store: match[1], price: parseFloat(match[2]), line: pl.trim() });
      }
    }

    prices.sort((a, b) => a.price - b.price);

    if (prices.length > 0) {
      sections.push(`**💰 Cheapest: ${prices[0].store} at $${prices[0].price.toFixed(2)}**`);
      if (prices.length > 1) {
        const savings = (prices[prices.length - 1].price - prices[0].price).toFixed(2);
        if (parseFloat(savings) > 0) {
          sections.push(`*Save up to $${savings} vs. ${prices[prices.length - 1].store}*`);
        }
      }
      sections.push("");
      for (const p of prices) {
        // Preserve markdown links from priceData
        const linkMatch = p.line.match(/\|\s*link:\s*(\S+)/);
        const storeName = linkMatch
          ? `[${p.store}](${linkMatch[1]})`
          : p.store;
        sections.push(`- ${storeName}: **$${p.price.toFixed(2)}**`);
      }
    }

    sections.push("");
  }

  if (sections.length <= 1) {
    sections.push("I couldn't find prices for those items right now. Try searching for specific products on the main search page!\n");
  }

  sections.push("---\n*Prices sourced from current flyer deals and store listings.*");

  return sections.join("\n");
}

/** Convert a full text string into an SSE stream response */
function streamText(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send text in chunks to simulate streaming
      const chunkSize = 40;
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract grocery-related search terms from user message */
function extractSearchTerms(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const found: string[] = [];

  // First, try to extract quoted terms
  const quoted = prompt.match(/"([^"]+)"/g);
  if (quoted) {
    found.push(...quoted.map((q) => q.replace(/"/g, "")));
  }

  // Remove common filler words to isolate product terms
  const stopWords = new Set([
    "find", "me", "the", "best", "price", "prices", "of", "for", "a", "an",
    "and", "or", "in", "at", "to", "is", "are", "what", "where", "which",
    "how", "much", "does", "do", "can", "you", "i", "my", "get", "show",
    "compare", "cheapest", "deal", "deals", "buy", "cost", "good", "near",
    "store", "stores", "grocery", "groceries", "shop", "shopping", "local",
    "online", "recommend", "suggestion", "suggestions", "help", "want",
    "need", "looking", "search", "check", "should", "would", "could",
    "please", "thanks", "thank", "right", "now", "today", "this", "week",
    "weekly", "current", "currently", "tell", "about", "with", "from",
    "have", "has", "been", "being", "some", "any", "all", "most", "more",
    "less", "than", "that", "these", "those", "their", "there", "here",
    "just", "also", "too", "very", "really", "quite", "on", "up", "it",
    "its", "plan", "budget", "trip", "under", "over", "between",
  ]);

  // Extract meaningful words/phrases from the prompt
  // First try multi-word food phrases
  const foodPhrases = [
    "ice cream", "paper towel", "toilet paper", "pet food", "dog food",
    "cat food", "chicken breast", "ground beef", "olive oil", "peanut butter",
    "cream cheese", "sour cream", "green onion", "bell pepper", "sweet potato",
    "brown rice", "white rice", "whole wheat", "almond milk", "oat milk",
    "soy sauce", "maple syrup", "baking soda", "baking powder",
  ];

  for (const phrase of foodPhrases) {
    if (lower.includes(phrase) && !found.includes(phrase)) {
      found.push(phrase);
    }
  }

  // Then extract remaining single-word product terms
  const words = lower.replace(/[^a-z0-9\s'-]/g, "").split(/\s+/);
  for (const word of words) {
    if (
      word.length >= 3 &&
      !stopWords.has(word) &&
      !found.some((f) => f.includes(word))
    ) {
      found.push(word);
    }
  }

  // If nothing specific found, use popular staples for general "best deals" queries
  if (found.length === 0) {
    const generalDealTerms = ["milk", "eggs", "chicken breast", "bread", "rice"];
    found.push(...generalDealTerms);
  }

  return found.slice(0, 6); // max 6 searches
}

/** Fetch real prices for a set of search terms */
async function fetchPriceContext(
  terms: string[],
  country: string,
  geo: { country: string; region?: string; city?: string }
): Promise<string> {
  if (terms.length === 0) return "No specific product data available.";

  const results = await Promise.all(
    terms.map(async (term) => {
      try {
        const { products, source } = await searchProductsReal(
          term,
          undefined,
          undefined,
          country,
          geo
        );
        if (products.length === 0) return `${term}: no data found`;

        // Summarize prices for each product
        return products
          .slice(0, 2)
          .map((p) => {
            const priceList = p.prices
              .slice(0, 10)
              .map(
                (pr) => {
                  // Build a reliable store search URL instead of using SerpAPI redirect URLs
                  const storeUrl = buildStoreDirectUrl(pr.storeName, term);
                  return `  - ${pr.storeName}: ${pr.currency} ${pr.price.toFixed(2)}${storeUrl ? ` | link: ${storeUrl}` : ""}`;
                }
              )
              .join("\n");
            return `📦 ${p.name} (source: ${source})\n${priceList}`;
          })
          .join("\n\n");
      } catch {
        return `${term}: lookup failed`;
      }
    })
  );

  return results.join("\n\n---\n\n");
}

/** Build the system prompt with price context */
function buildSystemPrompt(country: string, city: string, priceData: string): string {
  const location = city ? `${city}, ${country}` : country;

  return `You are the PriceCompare AI Deals Advisor — a friendly, knowledgeable grocery shopping assistant.

LOCATION: The user is shopping in ${location}.

YOUR CAPABILITIES:
- Analyze real-time grocery prices from stores in the user's area
- Recommend the best deals and where to shop
- Suggest money-saving strategies (bulk buying, store switching, seasonal items)
- Compare prices across stores (Walmart, Costco, Loblaws, No Frills, T&T, etc.)
- Help plan budget-friendly meals and shopping trips

CURRENT REAL PRICE DATA:
${priceData}

GUIDELINES:
- Use the real price data above when answering. Cite specific store names and prices.
- IMPORTANT: Each listing has a product title in quotes — these are DIFFERENT products (e.g. single avocado vs bag of 6, organic vs conventional, fresh vs frozen). Group and compare items of similar type/size. Don't compare a single item to a multi-pack.
- When showing prices, always include the product description so users know what they're comparing.
- If you mention a price, it must come from the data. Don't fabricate prices.
- When a store listing has a link, make the store name a clickable markdown link like [Store Name](url). NEVER display the raw URL — only use it inside the markdown link syntax. Example: [Walmart](https://walmart.ca/product) CAD $1.49
- Use markdown formatting: **bold** for store names, bullet points for lists.
- Be concise but helpful. Use emojis sparingly for visual appeal.
- If the user asks about items not in the data, say you'd need them to search for those items on the main search page.
- Always suggest the cheapest option first, then alternatives.
- When comparing, show savings (e.g., "Save $2.50 by choosing Store X over Store Y") — but only between comparable products.
- Mention if a deal is in-store only vs. online.
- Keep responses focused and actionable — this is a shopping assistant, not a chatbot.`;
}
