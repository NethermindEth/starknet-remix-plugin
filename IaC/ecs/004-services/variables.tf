variable "appautoscaling_target_max_capacity" {
  type    = number
  default = 10
}

variable "appautoscaling_target_min_capacity" {
  type    = number
  default = 1
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
