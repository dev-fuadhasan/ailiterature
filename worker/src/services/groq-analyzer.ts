import Groq from "groq-sdk";
import { z } from "zod";

// ─── API Key Rotation ───────────────────────────────────────────────────────
// Load multiple Groq API keys for automatic failover when rate limits are hit.
// Priority: GROQ_API_KEY_1 > GROQ_API_KEY_2 > ... > GROQ_API_KEY (fallback)
const API_KEYS: string[] = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY,  // Fallback to original env var
].filter((key): key is string => !!key);

if (API_KEYS.length === 0) {
  throw new Error("No Groq API keys found. Set GROQ_API_KEY or GROQ_API_KEY_1, etc.");
}

// Create Groq client instances for each key
const groqClients = API_KEYS.map((key, idx) => ({
  client: new Groq({ apiKey: key }),
  keyIndex: idx + 1,
  isExhausted: false,  // Track if this key is rate-limited
}));

let currentKeyIndex = 0;

function getGroqClient(): { client: Groq; keyIndex: number } {
  // Find next available (non-exhausted) key
  for (let i = 0; i < groqClients.length; i++) {
    const idx = (currentKeyIndex + i) % groqClients.length;
    if (!groqClients[idx].isExhausted) {
      currentKeyIndex = idx;
      return groqClients[idx];
    }
  }
  // All keys exhausted - reset and try again
  console.warn("[Groq] All API keys rate-limited, resetting exhaustion flags");
  groqClients.forEach(c => c.isExhausted = false);
  currentKeyIndex = 0;
  return groqClients[0];
}

function switchToNextKey(): void {
  // Mark current key as exhausted and move to next
  groqClients[currentKeyIndex].isExhausted = true;
  currentKeyIndex = (currentKeyIndex + 1) % groqClients.length;
  const nextKey = groqClients[currentKeyIndex];
  console.log(`[Groq] Switching to API key #${nextKey.keyIndex}${nextKey.isExhausted ? ' (exhausted)' : ''}`);
}

console.log(`[Groq] Initialized with ${API_KEYS.length} API key(s)`);

// ─── Sequential Groq request queue ─────────────────────────────────────────
// Problem: with CONCURRENCY=4 in the worker, all 4 analysis tasks fire Groq
// requests simultaneously, exhausting the TPM window of every model within
// seconds and causing cascading "All models exhausted" failures.
//
// Solution: serialise ALL Groq chat calls through a module-level promise chain
// so only ONE request runs at a time. PDF downloading/resolving stays fully
// parallel — only the cheap ~1-2 second LLM call is serialised.
// A minimum inter-call gap (MIN_GROQ_GAP_MS) prevents back-to-back bursts.
const MIN_GROQ_GAP_MS = 15000;
let _groqChain: Promise<unknown> = Promise.resolve();

function enqueueGroqCall<T>(fn: () => Promise<T>): Promise<T> {
  const next = _groqChain.then(
    () => fn(),
    () => fn(), // always run even if previous call errored
  );
  // Chain includes the inter-call gap so subsequent calls wait at least MIN_GROQ_GAP_MS
  _groqChain = next.then(
    () => new Promise<void>((r) => setTimeout(r, MIN_GROQ_GAP_MS + Math.random() * 2000)),
    () => new Promise<void>((r) => setTimeout(r, MIN_GROQ_GAP_MS + Math.random() * 2000)),
  );
  return next;
}

// ─── Model roster (ordered: SPEED/THROUGHPUT → fallback) ───────────────────
// Strategy for FREE tier: Use fastest model with highest TPM FIRST to avoid rate limits
// llama-3.1-8b-instant    : 131K ctx, 131K max-completion, 250K TPM, 560 tok/s — FASTEST
// openai/gpt-oss-120b     : 131K ctx, 65K max-completion, 250K TPM, 500 tok/s — medium
// llama-3.3-70b-versatile : 131K ctx, 32K max-completion, 300K TPM, 280 tok/s — slowest but best quality
const MODELS: { id: string; maxChars: number }[] = [
  { id: "llama-3.1-8b-instant",    maxChars: 25_000 },  // Fastest, use first
  { id: "openai/gpt-oss-120b",     maxChars: 30_000 },  // Medium speed
  { id: "llama-3.3-70b-versatile", maxChars: 35_000 },  // Best quality, last resort
];

// ─── Zod schema — validates & coerces AI output ────────────────────────────
const STUDY_TYPES = [
  "Empirical Study", "Systematic Review", "Meta-Analysis", "Survey",
  "Simulation", "Theoretical", "Case Study", "Experiment", "Mixed Methods",
] as const;

const ExtractionSchema = z.object({
  methodology : z.string().min(5),
  findings    : z.string().min(5),
  limitations : z.string().min(5).default("Not specified."),
  futureWork  : z.string().min(5).default("Not specified."),
  studyType   : z.enum(STUDY_TYPES).catch("Empirical Study"),
  keywords    : z.array(z.string().min(2)).min(1).max(10),
  confidence  : z.number().min(0).max(1).optional(),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema>;

// ─── Section-aware text extraction ─────────────────────────────────────────
const SECTION_HEADERS = /\b(abstract|introduction|background|related work|methodology|methods?|materials?|approach|experimental setup|results?|findings?|discussion|conclusion|future work|limitations?)\b/gi;

/**
 * Priority-weighted section slicer.
 * Detects paper sections, scores them by analytical value (Methods, Results,
 * Conclusion > Introduction > References), then packs the highest-value
 * content into the char budget.
 */
function sectionAwareTrim(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  // Find section boundaries
  const sections: { name: string; start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(SECTION_HEADERS.source, "gi");
  while ((match = re.exec(text)) !== null) {
    sections.push({ name: match[0].toLowerCase(), start: match.index, end: text.length });
    if (sections.length > 1) sections[sections.length - 2].end = match.index;
  }

  // Section priority weights
  const PRIORITY: Record<string, number> = {
    abstract: 9, methodology: 9, methods: 9, "materials": 8,
    results: 9, findings: 9, conclusion: 8, discussion: 7,
    introduction: 5, background: 4, "related work": 3,
    limitations: 8, "future work": 7,
  };

  if (sections.length === 0) {
    // No sections detected — keep start (methods) + end (results/conclusion)
    const front = Math.floor(maxChars * 0.55);
    const back  = maxChars - front;
    return text.slice(0, front) + "\n…[mid-section truncated]…\n" + text.slice(-back);
  }

  // Sort by priority, then fill budget greedily
  const scored = sections
    .map((s) => ({ ...s, priority: PRIORITY[s.name] ?? 3 }))
    .sort((a, b) => b.priority - a.priority);

  const selected: string[] = [];
  let used = 0;
  for (const sec of scored) {
    const chunk = text.slice(sec.start, sec.end).trim();
    const room  = maxChars - used;
    if (room <= 0) break;
    selected.push(chunk.length > room ? chunk.slice(0, room) + "…[truncated]" : chunk);
    used += Math.min(chunk.length, room);
  }
  return selected.join("\n\n");
}

// ─── Prompt ────────────────────────────────────────────────────────────────
const buildPrompt = (text: string, abstractOnly: boolean): string => `\
You are an expert systematic literature reviewer with domain expertise in science, medicine, and technology.

Analyze the following ${abstractOnly ? "ABSTRACT" : "PAPER TEXT"} and extract structured information.
Think step-by-step: first identify the study design, then findings, then quality/limitations.

${abstractOnly ? "ABSTRACT" : "PAPER TEXT"}:
"""
${text}
"""

Return ONLY a single valid JSON object matching this schema exactly — no markdown, no commentary:
{
  "methodology": "<Research design, data sources, sample size, statistical approach — be specific>",
  "findings": "<Key quantitative/qualitative results and main conclusions — include numbers if present>",
  "limitations": "<Explicit or implicit weaknesses, biases, scope constraints>",
  "futureWork": "<Future research directions suggested or implied>",
  "studyType": "<Exactly ONE of: Empirical Study | Systematic Review | Meta-Analysis | Survey | Simulation | Theoretical | Case Study | Experiment | Mixed Methods>",
  "keywords": ["<3-8 specific domain keywords>"],
  "confidence": <0.0-1.0 reflecting how complete/clear the paper text is>
}

Use "Not specified." for fields that cannot be determined from the available text.`;

// ─── Retry helpers ──────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Exponential backoff with full jitter: base * 2^attempt + random(0, base) */
function backoffMs(attempt: number, base = 15000): number {
  return Math.min(base * 2 ** attempt + Math.random() * base, 120_000);
}

// ─── Output validator ──────────────────────────────────────────────────────
function parseAndValidate(raw: string): ExtractionResult | null {
  try {
    // Strip markdown fences if model added them anyway
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed  = JSON.parse(cleaned);
    const result  = ExtractionSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("[Groq] Schema validation failed:", result.error.flatten().fieldErrors);
      return null;
    }
    // Quality gate: reject thin responses
    if (result.data.methodology.length < 5 || result.data.findings.length < 5) return null;
    return result.data;
  } catch {
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────
export async function analyzePaper(
  paperText: string,
  title: string,
  abstractOnly = false,
): Promise<ExtractionResult | null> {
  // All calls go through the sequential queue — prevents simultaneous TPM bursts
  return enqueueGroqCall(() => _analyzePaperInner(paperText, title, abstractOnly));
}

async function _analyzePaperInner(
  paperText: string,
  title: string,
  abstractOnly = false,
): Promise<ExtractionResult | null> {
  for (const { id: model, maxChars } of MODELS) {
    const budget   = abstractOnly ? Math.min(maxChars, 6_000) : maxChars;
    const trimmed  = sectionAwareTrim(paperText, budget);
    const prompt   = buildPrompt(trimmed, abstractOnly);
    const MAX_RETRY = 3;

    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        const { client: groq, keyIndex } = getGroqClient();
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an expert academic literature reviewer. " +
                "Output valid JSON only — no markdown code fences, no commentary.",
            },
            { role: "user", content: prompt },
          ],
          temperature  : 0.05,          // near-deterministic for structured extraction
          max_tokens   : 1_500,
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content ?? "";
        const result  = parseAndValidate(content);
        if (result) {
          console.log(`[Groq:Key${keyIndex}] ✓ ${model} (attempt ${attempt + 1}) → "${title.slice(0, 50)}"`);
          return result;
        }
        // Validation failed but no API error — retry same model
        console.warn(`[Groq:Key${keyIndex}] Validation failed on ${model}, attempt ${attempt + 1}`);

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isRateLimit = msg.includes("429") || msg.includes("413") || msg.includes("rate_limit");

        if (isRateLimit) {
          const { keyIndex } = getGroqClient();
          console.warn(`[Groq:Key${keyIndex}] Rate-limit on ${model}, attempt ${attempt + 1}`);
          
          // Switch to next API key immediately
          switchToNextKey();
          const { keyIndex: newKeyIndex } = getGroqClient();
          console.log(`[Groq] Switched to API key #${newKeyIndex}, retrying immediately`);
          
          // No sleep needed - we switched keys, can retry immediately
          continue;
        }

        console.error(`[Groq] Error on ${model} for "${title}":`, msg);
        break;                           // non-rate-limit error → try next model
      }
    }
  }

  console.error(`[Groq] All models exhausted for "${title}"`);
  return null;
}  // end _analyzePaperInner
