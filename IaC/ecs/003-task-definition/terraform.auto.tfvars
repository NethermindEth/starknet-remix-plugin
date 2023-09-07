################################################### Common Tfvars
project     = "starknet-remix"
environment = "development"
region      = "us-east-2"
owner       = "DevOps"

### NOTE: Check locals.tf file for more values to input

rocket_contianer_image  = "599564732950.dkr.ecr.us-east-2.amazonaws.com/starknet-remix-plugin:rocket-3"
devnet_containr_image   = "599564732950.dkr.ecr.us-east-2.amazonaws.com/starknet-remix-plugin:devnet-4"

rocket_container_def_json = {
  container_name           = "rocket"
  container_port           = "8000"
  host_port                = "8000"
  task_cpu                 = 512
  task_memory              = 1024
  requires_compatibilities = ["EC2"] ### valid EC2, FARGAT
}

devnet_container_def_json = {
  container_name           = "devnet"
  container_port           = "5050"
  host_port                = "5050"
  task_cpu                 = 512
  task_memory              = 1024
  requires_compatibilities = ["EC2"] ### valid EC2, FARGAT
}