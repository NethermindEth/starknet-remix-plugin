module "ecs_service_log_group" {
  source            = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/cloudwatch/log_group?ref=v0.0.1-rc.1"
  name              = "/ecs/${var.project}-${var.environment}-log-group"
  retention_in_days = var.log_group_retention_in_days
  tags              = local.tags
}
