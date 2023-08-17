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


##################################### ECS Task and Service Variables check locals.tf file
###########################################################CloudWatch Variables

variable "ecs_log_stream_prefix" {
  type    = string
  default = "ecs"
}
