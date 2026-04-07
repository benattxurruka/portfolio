terraform {
  required_version = ">= 1.6.0"

  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 3.7"
    }
  }

  # Remote state — configure to match your backend.
  # Option A: Terraform Cloud / HCP Terraform
  # backend "remote" {
  #   organization = "your-org"
  #   workspaces {
  #     name = "portfolio"
  #   }
  # }
  #
  # Option B: S3-compatible (e.g. Cloudflare R2 or AWS S3)
  # backend "s3" {
  #   bucket = "your-tfstate-bucket"
  #   key    = "portfolio/terraform.tfstate"
  #   region = "auto"
  #   ...
  # }
}

provider "grafana" {
  url  = var.grafana_url
  auth = var.grafana_service_account_token
}
