terraform {
  required_version = ">= 1.6.0"

  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 3.7"
    }
  }

  # State stored in Cloudflare R2 (S3-compatible).
  # Credentials and endpoint are passed at `terraform init` time — never stored here.
  # Required secrets: TF_STATE_R2_ACCESS_KEY_ID, TF_STATE_R2_SECRET_ACCESS_KEY
  # Required secret:  CLOUDFLARE_ACCOUNT_ID (already used by rotate-cloudflare workflow)
  # One-time setup: create a dedicated bucket named "portfolio-tfstate" in Cloudflare R2,
  # then create a non-rotating R2 API token with admin read+write on that bucket.
  backend "s3" {
    bucket                      = "portfolio-tfstate"
    key                         = "portfolio.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    force_path_style            = true
    # endpoints.s3 passed via -backend-config file at init time
  }
}

provider "grafana" {
  url  = var.grafana_url
  auth = var.grafana_service_account_token
}
