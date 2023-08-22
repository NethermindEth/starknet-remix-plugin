locals {
  tags = {
    Owner       = var.owner
    Project     = var.project
    Environment = var.environment
    Region      = var.region
    ManagedBy   = "Terraform"
  }
}