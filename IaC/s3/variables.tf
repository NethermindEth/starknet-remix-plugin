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

variable "acl" {
  type = string
}