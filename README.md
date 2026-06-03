# Portfolio

A personal portfolio with a photography gallery and GitHub projects feed. Built with Next.js 15 App Router, deployed on Vercel, photos stored in Cloudflare R2.

## Features

### Photography
- **Galleries** organised by places, themes, and favourites
- **Lightbox / slideshow** — full-screen viewer with auto-play, progress bar, photo counter
- **Keyboard shortcuts** — arrows to navigate, space to play/pause, up/down to show/hide info, Escape to close
- **Touch gestures** — swipe left/right to navigate (pinch-to-zoom ignored)
- **Info panel** — title, description, tags, location, date, and embedded OpenStreetMap with GPS coordinates
- **Voting** — heart votes with optimistic UI; persisted in R2 and cached locally in `localStorage`
- **Tags** — multilingual aliases (e.g. "Catalunya" → "catalonia") with canonical URL redirects
- **Google Cast** — send photos to Chromecast / Android TV

### GitHub projects
- Live list of non-forked, non-archived repositories sorted by last update
- Optional GitHub App authentication (raises rate limit from 60 → 5,000 req/hour)
- 1-hour ISR with stale-while-revalidate

### Admin panel (`/admin`)
- **Photos** — grid view, metadata editing (title, description, galleries, tags, EXIF), upload, replace, delete
- **Inbox** — contact form submissions with read/unread tracking
- **Tags** — manage multilingual tag translations
- Protected by a secret-based session cookie (`ADMIN_SECRET`)

### Internationalisation
- 4 languages: English, Spanish, Basque, Catalan (`en`, `es`, `eu`, `ca`)
- Locale detected from browser `Accept-Language` header and persisted in a cookie

### Observability
- **Sentry** — client error monitoring and session replay
- **OpenTelemetry → Grafana Cloud** — traces, metrics (photo views, votes, view duration, page views), and structured logs via OTLP
- **Grafana dashboards** — defined in `terraform/dashboards/`, deployed via Terraform

### Infrastructure & CI/CD
- **Vercel** — production deployments triggered by GitHub Actions on push to `main`
- **Token rotation** — automated monthly rotation of Cloudflare R2 and Grafana tokens; annual rotation of the GitHub App key
- **Terraform** — Grafana dashboards and alerts managed as code

---

## Tech stack

| Concern | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| i18n | next-intl |
| Photo storage | Cloudflare R2 (AWS SDK) |
| Error monitoring | Sentry |
| Metrics / Logs / Traces | OpenTelemetry → Grafana Cloud |
| Infrastructure | Terraform (Grafana provider) |
| CI/CD | GitHub Actions → Vercel |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in the values — see .env.local.example for documentation of each variable
```

### 3. Add photo metadata to R2

Create `_data/photos.json` in your R2 bucket. Use `data/photos-example.json` as a reference:

```json
{
  "photos": [
    {
      "id": "unique-photo-id",
      "r2Key": "photos/japan-2024/shinjuku.jpg",
      "title": "Shinjuku at night",
      "description": "Optional description",
      "takenAt": "2024-03-15",
      "location": "Tokyo, Japan",
      "lat": 35.6938,
      "lng": 139.7036,
      "galleries": ["favourites", "places/japan-2024", "themes/cityscape"],
      "tags": ["night", "urban"],
      "width": 4032,
      "height": 3024
    }
  ]
}
```

**Gallery key format:**

| Key | Gallery |
|---|---|
| `"favourites"` | My Favourites |
| `"places/japan-2024"` | Place: Japan 2024 |
| `"themes/cityscape"` | Theme: Cityscape |

A photo can belong to multiple galleries — add as many keys to `galleries` as needed.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying

Push to `main` — GitHub Actions lints, builds, and deploys to Vercel automatically.

For manual deploys:

```bash
npm run build
vercel deploy --prod
```

See `.github/workflows/README.md` for the full CI/CD reference including secrets, token rotation, and Terraform.

---

## Project structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── [locale]/               # i18n wrapper
│   │   ├── page.tsx            # Home
│   │   ├── github/             # GitHub projects
│   │   ├── photography/        # Gallery hub
│   │   │   ├── [gallery]/      # Gallery detail + lightbox
│   │   │   └── tag/[tag]/      # Tag-filtered gallery
│   │   ├── contact/            # Contact form
│   │   └── admin/              # Admin panel (protected)
│   │       ├── photos/         # Photo grid + edit + upload
│   │       ├── tags/           # Tag translation management
│   │       └── inbox/          # Contact message inbox
├── actions/                    # Server Actions (votes, messages, cache)
├── components/
│   ├── layout/                 # Sidebar, nav, theme/language switchers
│   ├── github/                 # Repo card and grid
│   └── photography/            # Gallery card, lightbox, slideshow, cast
├── hooks/                      # useLightbox, useVote, useCast, usePhotoTimer
├── lib/
│   ├── r2/                     # R2 client, photo/vote/message data access
│   ├── github/                 # GitHub API client + App auth
│   ├── otel/                   # OTel metrics and logger
│   └── utils/                  # Gallery derivation, tag normalisation, cn()
└── messages/                   # i18n translation files (en, es, eu, ca)

terraform/
├── main.tf                     # Grafana folder, dashboards, alert rule
├── variables.tf
└── dashboards/                 # Dashboard JSON definitions

.github/workflows/
├── deploy.yml                  # Lint, build, deploy
├── terraform.yml               # Grafana dashboard deployment
├── rotate-cloudflare-token.yml # Monthly R2 token rotation
├── rotate-github-token.yml     # Annual GitHub App key rotation
├── rotate-grafana-token.yml    # Monthly Grafana OTLP token rotation
└── README.md                   # Secrets reference and local testing guide
```

---

## Grafana dashboards

Dashboards are defined in `terraform/dashboards/` and deployed via Terraform when files under `terraform/` change.

**Prerequisites:**

- A Grafana Cloud account
- A service account token with the **Editor** role
- UIDs for your Prometheus, Loki, and Tempo datasources (**Connections → Datasources** in Grafana)

**Deploy manually:**

```bash
export TF_VAR_grafana_url="https://yourstack.grafana.net"
export TF_VAR_grafana_service_account_token="your_token"
export TF_VAR_prometheus_datasource_uid="your_uid"
export TF_VAR_loki_datasource_uid="your_uid"
export TF_VAR_tempo_datasource_uid="your_uid"

cd terraform
terraform init
terraform plan
terraform apply
```
