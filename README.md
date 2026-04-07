# Portfolio

A personal portfolio showcasing GitHub projects and a photography gallery.

## Features

- **GitHub Projects** — live list of repositories fetched from the GitHub API
- **Photography Gallery** — photos organised by trips, themes, and favourites; stored in Cloudflare R2
- **Slideshow** — full-screen lightbox with keyboard navigation and anonymous voting
- **Observability** — Sentry (errors), Grafana Cloud (traces + metrics + logs via OTel)
- **IaC** — Grafana dashboards deployed via Terraform + GitHub Actions

---

## Tech Stack

| Concern | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Photo storage | Cloudflare R2 |
| Error monitoring | Sentry |
| Metrics / Logs / Traces | OpenTelemetry → Grafana Cloud |
| Infrastructure | Terraform (Grafana provider) |
| CI/CD | GitHub Actions |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

See `.env.local.example` for full documentation of each variable.

### 3. Upload photo metadata to R2

Create a file named `_data/photos.json` in your R2 bucket following the schema in `data/photos-example.json`:

```json
{
  "photos": [
    {
      "id": "unique-photo-id",
      "r2Key": "photos/trip-name/filename.jpg",
      "title": "Photo Title",
      "description": "Optional description",
      "takenAt": "2024-01-15",
      "location": "City, Country",
      "galleries": [
        "favourites",
        "trips/trip-name",
        "themes/nature"
      ],
      "width": 4032,
      "height": 3024
    }
  ]
}
```

**Gallery key format:**

| Key | Gallery type |
|---|---|
| `"favourites"` | My Favourites |
| `"trips/japan-2024"` | Trip: Japan 2024 |
| `"themes/nature"` | Theme: Nature |

A photo can belong to multiple galleries — no duplication, just multiple keys in the `galleries` array.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in Vercel
3. Set all environment variables from `.env.local.example` in the Vercel project settings
4. Uncomment the `deploy-vercel` job in `.github/workflows/deploy.yml`

### Any Node.js host

```bash
npm run build
npm start
```

---

## Grafana Dashboards

Dashboards are defined in `terraform/dashboards/` and deployed via Terraform.

### Prerequisites

- A Grafana Cloud account
- A service account token with the **Editor** role
- UIDs for your Prometheus, Loki, and Tempo datasources (found under **Connections → Datasources** in Grafana)

### Configure GitHub secrets / vars

| Secret | Value |
|---|---|
| `GRAFANA_URL` | `https://yourstack.grafana.net` |
| `GRAFANA_SERVICE_ACCOUNT_TOKEN` | Service account token |

| Variable | Value |
|---|---|
| `GRAFANA_PROMETHEUS_DS_UID` | Prometheus datasource UID |
| `GRAFANA_LOKI_DS_UID` | Loki datasource UID |
| `GRAFANA_TEMPO_DS_UID` | Tempo datasource UID |

### Deploy manually

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── github/            # GitHub projects page
│   └── photography/       # Gallery pages
│       └── [gallery]/     # Gallery detail + lightbox
├── actions/               # Server Actions (vote, view tracking)
├── components/            # React components
│   ├── layout/            # Sidebar
│   ├── github/            # Repo card + grid
│   └── photography/       # Gallery card, photo grid, lightbox
├── hooks/                 # Client hooks (vote, lightbox, timer)
└── lib/
    ├── r2/                # Cloudflare R2 client + photo/vote data
    ├── otel/              # OTel metrics + logger
    └── utils/             # Gallery derivation logic + cn()

terraform/
├── main.tf                # Grafana folder, dashboards, alert
├── variables.tf
├── outputs.tf
└── dashboards/            # Dashboard JSON templates

.github/workflows/
├── deploy.yml             # Build + deploy
└── terraform.yml          # Terraform plan/apply
```
