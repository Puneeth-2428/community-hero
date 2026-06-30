provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "sqladmin_api" {
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

# Artifact Registry Repository
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "community-hero-repo"
  description   = "Docker repository for Community Hero"
  format        = "DOCKER"
}
