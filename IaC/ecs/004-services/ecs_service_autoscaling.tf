

resource "aws_appautoscaling_target" "ecs_target" {
  for_each           = local.service
  max_capacity       = var.appautoscaling_target_max_capacity
  min_capacity       = var.appautoscaling_target_min_capacity
  resource_id        = "service/${data.terraform_remote_state.ecs.outputs.ecs-cluster-name}/${each.value.ecs_service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "down" {
  for_each           = local.service
  name               = "${each.value.ecs_service_name}-scale-in"
  resource_id        = aws_appautoscaling_target.ecs_target[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[each.key].service_namespace
  policy_type        = "StepScaling"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = -10
      metric_interval_upper_bound = -0
      scaling_adjustment          = -2
    }
    step_adjustment {
      metric_interval_lower_bound = -20
      metric_interval_upper_bound = -10
      scaling_adjustment          = -4
    }
    step_adjustment {
      metric_interval_lower_bound = -30
      metric_interval_upper_bound = -20
      scaling_adjustment          = -6
    }
    step_adjustment {
      metric_interval_lower_bound = null
      metric_interval_upper_bound = -30
      scaling_adjustment          = -8
    }
  }
}

resource "aws_appautoscaling_policy" "up" {
  for_each           = local.service
  name               = "${each.value.ecs_service_name}-scale-out"
  resource_id        = aws_appautoscaling_target.ecs_target[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[each.key].service_namespace
  policy_type        = "StepScaling"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 10
      scaling_adjustment          = 2
    }
    step_adjustment {
      metric_interval_lower_bound = 10
      metric_interval_upper_bound = 20
      scaling_adjustment          = 4
    }
    step_adjustment {
      metric_interval_lower_bound = 20
      metric_interval_upper_bound = 30
      scaling_adjustment          = 6
    }
    step_adjustment {
      metric_interval_lower_bound = 30
      metric_interval_upper_bound = null
      scaling_adjustment          = 8
    }
  }
}