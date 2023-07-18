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


##################################### ECS Task and Service Variables 
/*
variable "task_defination_family" {
  type        = string
  default     = "angkor-task-defination-family-name"
  description = "name for the angkor task defination"
}

variable "image" {
  type        = string
  description = "container image to deploy"
}

variable "task_memory" {
  type        = number
  default     = 512
  description = "memory allocated for task"
}

variable "task_cpu" {
  type        = number
  default     = 512
  description = "cpu allocated for task"
}

variable "container_name" {
  type        = string
  default     = "angkor"
  description = "Container name should be belong to task defination of service"
}

variable "container_port" {
  type        = number
  default     = 8065
  description = "exposed port of service"
}

variable "requires_compatibilities" {
  type    = list(string)
  default = ["FARGATE"]
}*/
###########################################################CloudWatch Variables

variable "ecs_log_stream_prefix" {
  type    = string
  default = "ecs"
}
