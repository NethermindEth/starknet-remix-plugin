variable "network_base_cidr" {
  type        = string
  description = "Enter the NetworkBaseCidr"
}

variable "subnet_size" {
  description = "Enter the number of Hosts/EC2 machine,Want to deploy in a subnet.Example:- 1000 machine in a subnet"
}

variable "exclude_availablity_zones" {
  type        = list(any)
  description = "exclude_availablity_zones"
}

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


