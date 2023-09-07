module "ecs_service" {
  for_each                      = var.service
  source                        = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/ecs-service?ref=v0.0.1-rc.1"
  ecs_service_name              = each.value.ecs_service_name
  cluster_id                    = data.terraform_remote_state.ecs.outputs.ecs_cluster_id
  container_name                = each.value.container_name
  container_port                = each.value.container_port
  launch_type                   = each.value.launch_type
  aws_ecs_service_desired_count = each.value.aws_ecs_service_desired_count
  assign_public_ip              = false
  target_group_arn              = data.aws_lb_target_group.gp[each.key].arn
  task_definition_arn           = data.aws_ecs_task_definition.family[each.key].arn
  subnets_id                    = data.aws_subnets.private.ids
  security_groups_list          = [data.terraform_remote_state.ecs_alb.outputs.lb_ecs_sg, data.terraform_remote_state.ecs_alb.outputs.ecs_sg]
  tags                          = local.tags
}
