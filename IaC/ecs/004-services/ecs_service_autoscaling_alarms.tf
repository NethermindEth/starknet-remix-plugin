# locals {

#   ClusterName       = data.terraform_remote_state.ecs.outputs.ecs-cluster-name
#   ServiceName       = var.ecs_service_name
#   alarm_name_prefix = "${var.project}-${var.environment}"

#   metrics = [
#     {
#       actions_enabled     = true
#       alarm_actions       = [aws_appautoscaling_policy.down.arn]
#       alarm_description   = "${var.project} service down alarm"
#       alarm_name          = "${local.alarm_name_prefix}-scale-in-lower-threshold"
#       comparison_operator = "LessThanThreshold"
#       datapoints_to_alarm = 1
#       evaluation_periods  = "10"
#       metric_name         = "CPUUtilization"
#       namespace           = "AWS/ECS"
#       period              = "300"
#       statistic           = "Average"
#       threshold           = "50"

#       dimensions = {
#         ClusterName = local.ClusterName
#         ServiceName = local.ServiceName
#       }
#     },

#     {

#       actions_enabled     = true
#       alarm_actions       = [aws_appautoscaling_policy.up.arn]
#       alarm_description   = "${var.project} service scale out alarm"
#       alarm_name          = "${local.alarm_name_prefix}-scale-out-aggressive"
#       comparison_operator = "GreaterThanOrEqualToThreshold"
#       datapoints_to_alarm = 1
#       evaluation_periods  = "1"
#       metric_name         = "CPUUtilization"
#       namespace           = "AWS/ECS"
#       period              = "60"
#       statistic           = "Average"
#       threshold           = "50"

#       dimensions = {
#         ClusterName = local.ClusterName
#         ServiceName = local.ServiceName
#       }
#     }

#   ]
# }

# module "ecs_asg_alarms" {
#   source  = "../../../modules/cloudwatch/alarms"
#   metrics = local.metrics
#   tags    = local.tags
# }





