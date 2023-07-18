terraform {
  backend "s3" {
    bucket  = "starknet-remix-tf-infra"
    encrypt = true
    key     = "tfstate/ecs-alb.tfstate"
    region  = "us-east-2"
  }
}
provider "aws" {
  region = var.region
}
