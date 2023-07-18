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

data "aws_ami" "ecs" {
  most_recent = true
  name_regex  = "^amzn2-ami*"
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}