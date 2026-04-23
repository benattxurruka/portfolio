# ---------------------------------------------------------------------------
# Grafana folder
# ---------------------------------------------------------------------------
resource "grafana_folder" "portfolio" {
  title = var.dashboard_folder
}

# ---------------------------------------------------------------------------
# Photo metrics dashboard
# ---------------------------------------------------------------------------
resource "grafana_dashboard" "photo_metrics" {
  folder      = grafana_folder.portfolio.uid
  config_json = templatefile("${path.module}/dashboards/photo_metrics.json", {
    prometheus_ds_uid = var.prometheus_datasource_uid
    loki_ds_uid       = var.loki_datasource_uid
  })
}

# ---------------------------------------------------------------------------
# App overview dashboard
# ---------------------------------------------------------------------------
resource "grafana_dashboard" "app_overview" {
  folder      = grafana_folder.portfolio.uid
  config_json = templatefile("${path.module}/dashboards/app_overview.json", {
    prometheus_ds_uid = var.prometheus_datasource_uid
    loki_ds_uid       = var.loki_datasource_uid
    tempo_ds_uid      = var.tempo_datasource_uid
  })
}

# ---------------------------------------------------------------------------
# Alert: high error rate (>5 % of requests return 5xx)
# ---------------------------------------------------------------------------
resource "grafana_rule_group" "portfolio_alerts" {
  name             = "portfolio-alerts"
  folder_uid       = grafana_folder.portfolio.uid
  interval_seconds = 60

  rule {
    name      = "High Error Rate"
    condition = "C"

    data {
      ref_id = "A"
      relative_time_range {
        from = 300
        to   = 0
      }
      datasource_uid = var.prometheus_datasource_uid
      model = jsonencode({
        expr          = "sum(rate(portfolio_http_requests_total{status=~\"5..\"}[5m])) / sum(rate(portfolio_http_requests_total[5m]))"
        instant       = true
        intervalMs    = 1000
        maxDataPoints = 43200
        refId         = "A"
      })
    }

    data {
      ref_id = "C"
      relative_time_range {
        from = 0
        to   = 0
      }
      datasource_uid = "__expr__"
      model = jsonencode({
        conditions = [{
          evaluator = { params = [0.05], type = "gt" }
          operator  = { type = "and" }
          query     = { params = ["A"] }
          reducer   = { params = [], type = "last" }
          type      = "query"
        }]
        refId = "C"
        type  = "classic_conditions"
      })
    }

    annotations = {
      summary     = "Portfolio error rate exceeded 5%"
      description = "More than 5% of requests are returning 5xx errors over the last 5 minutes."
    }

    labels = {
      severity = "warning"
      service  = "portfolio"
    }

    no_data_state  = "NoData"
    exec_err_state = "Error"

    for = "5m"

    notification_settings {
      contact_point = "grafana-default-email"
    }
  }
}
