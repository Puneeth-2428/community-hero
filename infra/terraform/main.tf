terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Note: For production, configure a remote state backend (e.g., S3 + DynamoDB)
  # backend "s3" {
  #   bucket         = "community-hero-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CommunityHero"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS Region"
  default     = "ap-south-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  default     = "communityhero.app"
}
