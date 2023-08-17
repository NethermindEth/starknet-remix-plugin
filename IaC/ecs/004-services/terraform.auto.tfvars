################################################### Common Tfvars
project     = "starknet-remix"
environment = "development"
region      = "us-east-2"
owner       = "DevOps"

##################################### ECS Task and Service Variables

appautoscaling_target_max_capacity = 10
appautoscaling_target_min_capacity = 1

### Check locals.tf file for service inputs
