################################################### Common Tfvars
project     = "starknet-remix"
environment = "development"
region      = "us-east-2"
owner       = "DevOps"

##################################### ECS Task and Service Variables

appautoscaling_target_max_capacity = 10
appautoscaling_target_min_capacity = 1


  service = {
    rocket = {
      ecs_service_name              = "rocket-development-svc"
      aws_ecs_service_desired_count = 1
      container_name                = "rocket"
      container_port                = 8000
      launch_type                   = "EC2"
    },
    devnet = {
      ecs_service_name              = "devnet-development-svc"
      aws_ecs_service_desired_count = 1
      container_name                = "devnet"
      container_port                = 5050
      launch_type                   = "EC2"
    }
  }