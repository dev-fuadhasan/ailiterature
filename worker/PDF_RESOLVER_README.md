# PDF Link Resolver + Downloader

Automatically resolves, validates, and downloads **public / Open-Access** PDFs for academic papers. Strictly legal — never bypasses paywalls, logins, or CAPTCHAs.

## Architecture

```
Next.js API route                BullMQ (Redis)          Railway Worker
POST /api/papers/resolve-pdf  ──►  pdf-resolver queue  ──►  pdfWorker
GET  /api/papers/jobs/:id     ◄──  job state / result  ◄──  resolvePdfUrl()
```

## Environment Variables

### Worker (`worker/.env`)
| Variable | Required | Description |
|---|---|---|
| `REDIS_URL` | ✅ | Redis connection string (same as main pipeline) |
| `UNPAYWALL_EMAIL` | ✅ | Your email for the Unpaywall polite-pool API |
| `R2_ENDPOINT` | ✅ | Cloudflare R2 endpoint URL |
| `R2_ACCESS_KEY_ID` | ✅ | R2 access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 secret key |
| `R2_BUCKET_NAME` | ✅ | R2 bucket name (e.g. `research`) |
| `DATABASE_URL` | ✅ | Postgres connection string |

### Next.js (`.env.local`)
Same `REDIS_URL` as the worker — used by API routes to enqueue jobs.

## Resolution Strategies (in order)

1. **Unpaywall** — calls `api.unpaywall.org/v2/{doi}?email=…` — returns `best_oa_location.url_for_pdf`
2. **HTML meta tags** — fetches `landing_url`, parses (priority order):
   - `<meta name="citation_pdf_url">` (MDPI, Springer, Wiley …)
   - `<link rel="alternate" type="application/pdf">`  (arXiv)
   - `<meta name="DC.Identifier.URI">` (institutional repos)
   - Anchor heuristics: `href` containing `.pdf`, `/pdf/`, `download`, `/epdf/`, `/pdfs/`
   - Same-domain links ranked before cross-domain links
3. **PDF validation** — HEAD request checks Content-Type; ranged GET (0–4 KB) checks `%PDF` magic bytes
4. **Download → R2** — streams full PDF, verifies `%PDF` again, stores to `papers/{hash}-{slug}.pdf`

## API

### `POST /api/papers/resolve-pdf`

Enqueues a PDF resolution job (idempotent by DOI / title hash).

**Request body:**
```json
{
  "title": "Attention Is All You Need",
  "authors": ["Vaswani, A."],
  "year": 2017,
  "doi": "10.48550/arXiv.1706.03762",
  "landing_url": "https://arxiv.org/abs/1706.03762",
  "source": "arxiv"
}
```

**Response `202`:**
```json
{ "jobId": "a3f8c2d1e09b4567" }
```

**Response `200`** (cache hit — already completed):
```json
{
  "jobId": "a3f8c2d1e09b4567",
  "status": "completed",
  "result": { "status": "DOWNLOADED", "file_path": "papers/…pdf", … }
}
```

### `GET /api/papers/jobs/:id`

Poll a job's current state.

**Response:**
```json
{
  "id": "a3f8c2d1e09b4567",
  "status": "completed",
  "progress": 100,
  "result": {
    "status": "DOWNLOADED",
    "pdf_url": "https://arxiv.org/pdf/1706.03762.pdf",
    "final_url": "https://arxiv.org/pdf/1706.03762.pdf",
    "file_path": "papers/abc123-attention-is-all-you-need.pdf",
    "reason": null,
    "evidence": {
      "method": "meta_tag",
      "matched_selector_or_tag": "link[rel=\"alternate\"][type=\"application/pdf\"]"
    }
  },
  "error": null
}
```

**`status`** values: `waiting` | `active` | `completed` | `failed` | `delayed`

**`result.status`** values:
| Value | Meaning |
|---|---|
| `DOWNLOADED` | PDF found, validated, and stored in R2 |
| `FOUND_LINK_ONLY` | Valid PDF URL found but download/storage failed |
| `NO_PUBLIC_PDF` | No OA PDF located for this paper |
| `FAILED` | Unexpected error |

## Safety Controls

| Control | Value |
|---|---|
| Domain denylist | sci-hub.*, libgen.*, z-lib.org, b-ok.org |
| Per-domain rate limit | 1 req/s default; configurable in `domain-throttle.ts` |
| Max PDF file size | 50 MB |
| HTML fetch cap | 2 MB |
| Retry strategy | Exponential backoff, max 2 attempts |
| HTTP timeout | 15 s (HTML) / 120 s (PDF download) |

## Running Tests

```bash
cd worker
npm test          # vitest run (single pass)
npm run test:watch  # watch mode
```

## Local Development

```bash
cd worker
cp .env.example .env   # fill in your vars
npm run dev            # starts both workers (research-pipeline + pdf-resolver)
```

Then in another terminal:
```bash
# Enqueue a test job
curl -X POST http://localhost:3000/api/papers/resolve-pdf \
  -H "Content-Type: application/json" \
  -d '{"title":"Attention Is All You Need","authors":[],"year":2017,"doi":"10.48550/arXiv.1706.03762","landing_url":"https://arxiv.org/abs/1706.03762"}'

# Poll the job (replace JOB_ID)
curl http://localhost:3000/api/papers/jobs/JOB_ID
```
