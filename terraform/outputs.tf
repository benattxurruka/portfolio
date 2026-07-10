output "photo_metrics_dashboard_url" {
  description = "URL of the photo metrics Grafana dashboard"
  value       = "${var.grafana_url}/d/${grafana_dashboard.photo_metrics.dashboard_id}"
}

output "app_overview_dashboard_url" {
  description = "URL of the app overview Grafana dashboard"
  value       = "${var.grafana_url}/d/${grafana_dashboard.app_overview.dashboard_id}"
}
