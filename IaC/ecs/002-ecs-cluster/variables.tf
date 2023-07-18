variable "ecs_cluster_name" {
  type    = string
  default = "starknet-remix-plugin-cluster"
}

variable "launch_type_ec2" {
  type        = bool
  description = "Deploy EC2 if condition is true else deploy Fargate"
}
###################################################ssh variables

variable "ecs_instance_access_key_name" {
  type    = string
  default = "ec2-ssh-key"
}

variable "ssh_public_key" {
  type = string
}
####################################################launch configuration variables

variable "lc_name_prefix" {
  type    = string
  default = "lauch-configuration-"
}

variable "lc_image_id" {
  type    = string
  default = "ami-02d8bad0a1da4b6fd"
}


variable "lc_instance_type" {
  type    = string
  default = "m5a.2xlarge"
}


variable "lc_volume_size" {
  type    = number
  default = 30
}


variable "lc_volume_type" {
  type    = string
  default = "gp2"
}


##################################################Auto scaling groups variables


variable "asg_name" {
  type    = string
  default = "autoscaling-group"
}

variable "asg_min_size" {
  type    = number
  default = 1
}

variable "asg_max_size" {
  type    = number
  default = 10
}

variable "asg_desired_capacity" {
  type    = number
  default = 2
}
variable "asg_health_check_type" {
  type    = string
  default = "EC2"
}
variable "asg_protect_from_scale_in" {
  type    = bool
  default = true
}

##################################################EKS Cluster Capacity variables

variable "default_capacity_provider_strategy_base" {
  type    = number
  default = 0

}

variable "default_capacity_provider_strategy_weight" {
  type    = number
  default = 1

}

variable "maximum_scaling_step_size" {
  type    = number
  default = 10
}

variable "minimum_scaling_step_size" {
  type    = number
  default = 1
}

variable "target_capacity" {
  type    = number
  default = 10
}

###########################################################CloudWatch Variables

variable "log_group_retention_in_days" {
  type    = number
  default = 7
}

##################################### Common Project Variables
variable "project" {
  type        = string
  description = "Project Name"
}
variable "environment" {
  type        = string
  description = "Enviornment Name"
}
variable "region" {
  type        = string
  description = "Region Name"
}
variable "owner" {
  type        = string
  description = "Owner Name"
}
