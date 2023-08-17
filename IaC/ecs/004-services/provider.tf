terraform {
  backend "s3" {
    bucket = "starknet-remix-tf-infra"
    key    = "tfstate/ecs-service.tfstate"
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

data "terraform_remote_state" "ecs_tasks" {
  backend = "s3"

  config = {
    bucket = "starknet-remix-tf-infra"
    key    = "tfstate/ecs-tasks.tfstate"
    region = "us-east-2"
  }
}

data "terraform_remote_state" "ecs_alb" {
  backend = "s3"

  config = {
    bucket = "starknet-remix-tf-infra"
    key    = "tfstate/ecs-alb.tfstate"
    region = "us-east-2"
  }
}