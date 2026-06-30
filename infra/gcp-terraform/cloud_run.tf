resource "google_cloud_run_v2_service" "api" {
  name     = "community-hero-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = var.api_image
      
      env {
        name  = "DATABASE_URL"
        value = "postgresql://${google_sql_user.db_user.name}:${var.db_password}@/communityherodb?host=/cloudsql/${google_sql_database_instance.postgres_instance.connection_name}"
      }
      env {
        name = "JWT_SECRET"
        value = "placeholder-replace-in-secret-manager"
      }
      env {
        name = "PORT"
        value = "4000"
      }
    }
  }

  depends_on = [google_project_service.run_api]
}

resource "google_cloud_run_v2_service" "web" {
  name     = "community-hero-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = var.web_image
      
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.api.uri
      }
      env {
        name  = "NEXTAUTH_URL"
        value = "placeholder-replace-later"
      }
      env {
        name  = "NEXTAUTH_SECRET"
        value = "placeholder-replace-in-secret-manager"
      }
    }
  }

  depends_on = [google_project_service.run_api]
}

# Allow unauthenticated access (public)
resource "google_cloud_run_service_iam_member" "public_api" {
  location = google_cloud_run_v2_service.api.location
  service  = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "public_web" {
  location = google_cloud_run_v2_service.web.location
  service  = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
