module "task_definition" {
  for_each = local.container_def_json

  source                   = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/ecs-task?ref=v0.0.1-rc.1"
  task_defination_family   = "${var.project}-${var.environment}-${each.key}"
  requires_compatibilities = each.value.requires_compatibilities
  network_mode             = "awsvpc"
  container_definitions    = each.value.container_def_json
  task_memory              = each.value.task_memory
  task_cpu                 = each.value.task_cpu
  execution_role_arn       = data.terraform_remote_state.ecs.outputs.iam_ecs_task_execution_role_arn
  task_role_arn            = data.terraform_remote_state.ecs.outputs.iam_ecs_task_execution_role_arn
  tags                     = local.tags
}

