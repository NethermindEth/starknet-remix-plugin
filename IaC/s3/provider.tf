terraform {
  backend "s3" {
    bucket  = "starknet-remix-tf-infra"
    encrypt = true
    key     = "tfstate/s3.tfstate"
    region  = "us-east-2"
  }
}
provider "aws" {
  region = var.region
}
