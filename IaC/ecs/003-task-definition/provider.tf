terraform {
  backend "s3" {
    bucket = "starknet-remix-tf-infra"
    key    = "tfstate/ecs-tasks.tfstate"
    region = "us-east-2"
  }
}
provider "aws" {
  region = var.region
}

data "terraform_remote_state" "ecs" {
  backend = "s3"

  config = {
    bucket = "starknet-remix-tf-infra"
    key    = "tfstate/ecs.tfstate"
    region = "us-east-2"
  }
}