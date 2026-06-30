resource "google_sql_database_instance" "postgres_instance" {
  name             = "community-hero-db"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"
  }
  
  deletion_protection = false # Set to true in production
  depends_on          = [google_project_service.sqladmin_api]
}

resource "google_sql_user" "db_user" {
  name     = "communityhero"
  instance = google_sql_database_instance.postgres_instance.name
  password = var.db_password
}

resource "google_sql_database" "database" {
  name     = "communityherodb"
  instance = google_sql_database_instance.postgres_instance.name
}
