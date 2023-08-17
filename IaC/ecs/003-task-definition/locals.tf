locals {
  tags = {
    Owner       = var.owner
    Project     = var.project
    Environment = var.environment
    Region      = var.region
    ManagedBy   = "Terraform"
  }

  container_def_json = {
    # remix = {
    #   container_def_json = templatefile("${path.module}/container_def.json.tpl", {
    #     image                 = "599564732950.dkr.ecr.us-east-2.amazonaws.com/starknet-remix-plugin:remix-1",
    #     container_name        = "remix",
    #     container_port        = "3000",
    #     host_port             = "3000",
    #     aws_log_group_region  = var.region,
    #     aws_log_stream_prefix = var.ecs_log_stream_prefix,
    #     aws_log_group         = "${data.terraform_remote_state.ecs.outputs.log_group_id}"
    #   })
    #   task_cpu                 = 128
    #   task_memory              = 128
    #   requires_compatibilities = ["EC2"] ### valid EC2, FARGATE
    # },

    rocket = {
      container_def_json = templatefile("${path.module}/container_def.json.tpl", {
        image                 = "599564732950.dkr.ecr.us-east-2.amazonaws.com/starknet-remix-plugin:rocket-3",
        container_name        = "rocket",
        container_port        = "8000",
        host_port             = "8000",
        aws_log_group_region  = var.region,
        aws_log_stream_prefix = var.ecs_log_stream_prefix,
        aws_log_group         = "${data.terraform_remote_state.ecs.outputs.log_group_id}"
      })
      task_cpu                 = 512
      task_memory              = 1024
      requires_compatibilities = ["EC2"] ### valid EC2, FARGATE
    },

    devnet = {
      container_def_json = templatefile("${path.module}/container_def.json.tpl", {
        image                 = "599564732950.dkr.ecr.us-east-2.amazonaws.com/starknet-remix-plugin:devnet-4",
        container_name        = "devnet",
        container_port        = "5050",
        host_port             = "5050",
        aws_log_group_region  = var.region,
        aws_log_stream_prefix = var.ecs_log_stream_prefix,
        aws_log_group         = "${data.terraform_remote_state.ecs.outputs.log_group_id}"
      })
      task_cpu                 = 512
      task_memory              = 1024
      requires_compatibilities = ["EC2"] ### valid EC2, FARGATE
    }
  }
}