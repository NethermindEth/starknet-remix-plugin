module "alb" {
  source                                 = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/alb?ref=v0.0.1-rc.1"
  name                                   = "${var.project}-${var.environment}-alb"
  target_group_name                      = "${var.project}-${var.environment}-tg"
  security_groups                        = [module.loadbalancer_ecs_sg.id]
  subnets                                = data.aws_subnets.public.ids
  vpc_id                                 = data.aws_vpc.vpc.id
  health_check                           = var.health_check_remix
  alb_https_listener_enabled             = var.alb_https_listener_enabled
  alb_https_listener_ssl_policy          = var.alb_https_listener_ssl_policy
  alb_https_listener_ssl_certificate_arn = var.alb_https_listener_ssl_certificate_arn
  internal                               = var.internal
  tags                                   = local.tags
}

module "alb-2" {
  source                                 = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/alb?ref=v0.0.1-rc.1"
  name                                   = "${var.project}-dev-alb-rocket"
  target_group_name                      = "${var.project}-dev-tg-rocket"
  security_groups                        = [module.loadbalancer_ecs_sg.id]
  subnets                                = data.aws_subnets.public.ids
  vpc_id                                 = data.aws_vpc.vpc.id
  health_check                           = var.health_check_rocket
  alb_https_listener_enabled             = var.alb_https_listener_enabled
  alb_https_listener_ssl_policy          = var.alb_https_listener_ssl_policy
  alb_https_listener_ssl_certificate_arn = var.alb_https_listener_ssl_certificate_arn
  internal                               = var.internal
  tags                                   = local.tags
}

module "alb-3" {
  source                                 = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/alb?ref=v0.0.1-rc.1"
  name                                   = "${var.project}-dev-alb-devnet"
  target_group_name                      = "${var.project}-dev-tg-devnet"
  security_groups                        = [module.loadbalancer_ecs_sg.id]
  subnets                                = data.aws_subnets.public.ids
  vpc_id                                 = data.aws_vpc.vpc.id
  health_check                           = var.health_check_devnet
  alb_https_listener_enabled             = var.alb_https_listener_enabled
  alb_https_listener_ssl_policy          = var.alb_https_listener_ssl_policy
  alb_https_listener_ssl_certificate_arn = var.alb_https_listener_ssl_certificate_arn
  internal                               = var.internal
  tags                                   = local.tags
}
