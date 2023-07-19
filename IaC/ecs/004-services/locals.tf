locals {
  tags = {
    Owner       = var.owner
    Project     = var.project
    Environment = var.environment
    Region      = var.region
    ManagedBy   = "Terraform"
  }

  service = {
    # remix = {
    #   ecs_service_name              = "remix-development-svc"
    #   aws_ecs_service_desired_count = 1
    #   target_group_arn              = data.terraform_remote_state.ecs_alb.outputs.alb_target_group_arn_remix
    #   container_name                = "remix"
    #   container_port                = 3000
    #   launch_type                   = "EC2"
    # },
    rocket = {
      ecs_service_name              = "rocket-development-svc"
      aws_ecs_service_desired_count = 1
   #   target_group_arn              = data.aws_lb_target_group.gp.arn
      container_name                = "rocket"
      container_port                = 8000
      launch_type                   = "EC2"
    },
    devnet = {
      ecs_service_name              = "devnet-development-svc"
      aws_ecs_service_desired_count = 1
     # target_group_arn              = data.terraform_remote_state.ecs_alb.outputs.alb_target_group_arn_devnet
      container_name                = "devnet"
      container_port                = 5050
      launch_type                   = "EC2"
    }
  }
}