variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources to"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "Password for the PostgreSQL database"
  type        = string
  sensitive   = true
}

variable "api_image" {
  description = "Container image for the API"
  type        = string
}

variable "web_image" {
  description = "Container image for the Web App"
  type        = string
}
