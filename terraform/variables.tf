variable "grafana_url" {
  description = "Grafana Cloud stack URL, e.g. https://yourstack.grafana.net"
  type        = string
}

variable "grafana_service_account_token" {
  description = "Grafana service account token with Editor role"
  type        = string
  sensitive   = true
}

variable "prometheus_datasource_uid" {
  description = "UID of the Prometheus / Grafana Cloud Metrics datasource"
  type        = string
}

variable "loki_datasource_uid" {
  description = "UID of the Loki datasource"
  type        = string
}

variable "tempo_datasource_uid" {
  description = "UID of the Tempo datasource"
  type        = string
}

variable "dashboard_folder" {
  description = "Grafana folder name for portfolio dashboards"
  type        = string
  default     = "Portfolio"
}
