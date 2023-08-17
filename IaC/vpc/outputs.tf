output "private_subnets_ids_with_ng" {
  description = "vpc-id"
  value       = module.network.private_subnets_ids_with_ng
}

output "public_subnets_ids" {
  description = ""
  value       = module.network.public_subnets_ids
}

output "private_subnets_ids_without_ng" {
  description = "Id of the VPC"
  value       = module.network.private_subnets_ids_without_ng
}

output "vpc_id" {
  description = "Id of the VPC"
  value       = module.network.vpc_id
}

output "used_az_names_in_vpc" {
  value = module.network.used_az_names
}

