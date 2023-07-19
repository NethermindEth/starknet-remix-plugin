

module "loadbalancer_ecs_sg" {
  source = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/security-group?ref=v0.0.1-rc.1"

  component_name = "${var.project}_${var.environment}_loadbalancer_ecs_SG"
  description    = "Secuity Group for ${var.project} ECS Loadbalancer"
  project        = var.project
  owner          = var.owner
  environment    = var.environment
  region         = var.region

  vpc_id = data.aws_vpc.vpc.id

  egress_rules = [
    {
      description      = "base default rule"
      from_port        = 0
      to_port          = 0
      protocol         = "-1"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      security_groups  = null
    }
  ]

  ingress_rules = [
    {
      description      = "allow traffic on the http port"
      from_port        = 80
      to_port          = 80
      protocol         = "TCP"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      security_groups  = null
    },
    {
      description      = "allow traffic on the https port"
      from_port        = 443
      to_port          = 443
      protocol         = "TCP"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      security_groups  = null
    }
  ]
}


module "ecs_sg" {
  source = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/security-group?ref=v0.0.1-rc.1"

  component_name = "${var.project}_${var.environment}_ecs_SG"
  description    = "Secuity Group for ${var.project} ECS"
  project        = var.project
  owner          = var.owner
  environment    = var.environment
  region         = var.region

  vpc_id = data.aws_vpc.vpc.id

  egress_rules = [
    {
      description      = "base default rule"
      from_port        = 0
      to_port          = 0
      protocol         = "-1"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      security_groups  = null
    }
  ]

  ingress_rules = [
    {
      description      = "allow traffic on the ssh port"
      from_port        = 22
      to_port          = 22
      protocol         = "TCP"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      security_groups  = null
    },
    {
      description      = "allow traffic on the https port"
      from_port        = 0
      to_port          = 0
      protocol         = "-1"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      security_groups  = [module.loadbalancer_ecs_sg.id]
    }
  ]
  depends_on = [
    module.loadbalancer_ecs_sg
  ]
}
