data "aws_vpc" "vpc" {
  filter {
    name   = "tag:Name"
    values = ["${var.project}-${var.environment}-vpc"]
  }
}

data "aws_subnets" "private" {
  filter {

    name   = "vpc-id"
    values = [data.aws_vpc.vpc.id]
  }
  tags = {
    Subnet = "private-with-ng"
  }
}

data "aws_subnets" "public" {
  filter {

    name   = "vpc-id"
    values = [data.aws_vpc.vpc.id]
  }
  tags = {
    Subnet = "public"
  }
}

data "aws_ecs_task_definition" "family" {
  for_each        = var.service
  task_definition = "${var.project}-${var.environment}-${each.key}"
}

data "aws_lb_target_group" "gp" {
  for_each = var.service
  name     = "${var.project}-dev-${each.key}-tg"
}