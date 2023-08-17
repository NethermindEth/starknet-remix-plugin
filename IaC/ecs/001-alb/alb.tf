module "alb" {
  source          = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/alb?ref=v0.0.1-rc.1"
  name            = "${var.project}-${var.environment}-alb"
  security_groups = [module.loadbalancer_ecs_sg.id]
  subnets         = data.aws_subnets.public.ids
  vpc_id          = data.aws_vpc.vpc.id
  internal        = var.internal
  tags            = local.tags
}

resource "aws_lb_target_group" "default" {
  for_each = var.aws_lb_target_group

  health_check {
    path                = each.value.health_check["path"]
    healthy_threshold   = each.value.health_check["healthy_threshold"]
    interval            = each.value.health_check["interval"]
    timeout             = each.value.health_check["timeout"]
    unhealthy_threshold = each.value.health_check["unhealthy_threshold"]
    port                = each.value.health_check["port"]
  }
  name        = each.value.target_group_name
  port        = var.alb_http_listener_port
  protocol    = var.alb_http_listener_protocol
  vpc_id      = data.aws_vpc.vpc.id
  target_type = "ip"
  tags        = local.tags
}

resource "aws_lb_listener" "front_end" {
  load_balancer_arn = module.alb.alb_arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-east-2:599564732950:certificate/4825b048-7a0b-4ccf-97a6-5376ef723f66"
  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Moved"
      status_code  = "503"
    }
  }
}

resource "aws_lb_listener_rule" "api_rule" {
  for_each = var.aws_lb_target_group

  listener_arn = aws_lb_listener.front_end.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.default[each.key].arn
  }

  condition {
    host_header {
      values = each.value.host_header
    }
  }
}