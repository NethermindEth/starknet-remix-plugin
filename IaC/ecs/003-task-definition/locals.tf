locals {
  tags = {
    Owner       = var.owner
    Project     = var.project
    Environment = var.environment
    Region      = var.region
    ManagedBy   = "Terraform"
  }

  container_def_json = {
    rocket = {
      container_def_json = templatefile("${path.module}/container_def.json.tpl", {
        image                 = var.rocket_contianer_image,
        container_name        = var.rocket_container_def_json.container_name,
        container_port        = var.rocket_container_def_json.container_port,
        host_port             = var.rocket_container_def_json.host_port,
        aws_log_group_region  = var.region,
        aws_log_stream_prefix = var.ecs_log_stream_prefix,
        aws_log_group         = "${data.terraform_remote_state.ecs.outputs.log_group_id}"
      })
      task_cpu                 = var.rocket_container_def_json.task_cpu
      task_memory              = var.rocket_container_def_json.task_memory
      requires_compatibilities = var.rocket_container_def_json.requires_compatibilities
    },

    devnet = {
      container_def_json = templatefile("${path.module}/container_def.json.tpl", {
        image                 = var.devnet_containr_image,
        container_name        = var.devnet_container_def_json.container_name,
        container_port        = var.devnet_container_def_json.container_port,
        host_port             = var.devnet_container_def_json.host_port,
        aws_log_group_region  = var.region,
        aws_log_stream_prefix = var.ecs_log_stream_prefix,
        aws_log_group         = "${data.terraform_remote_state.ecs.outputs.log_group_id}"
      })
      task_cpu                 = var.devnet_container_def_json.task_cpu
      task_memory              = var.devnet_container_def_json.task_memory
      requires_compatibilities = var.devnet_container_def_json.requires_compatibilities
    }
  }
}