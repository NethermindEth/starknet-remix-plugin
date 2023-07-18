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
    Subnet = "private"
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


