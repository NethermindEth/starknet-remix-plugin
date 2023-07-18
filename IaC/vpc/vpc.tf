# create networking components
module "network" {
  source                    = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/network?ref=v0.0.1-rc.1"
  network_base_cidr         = var.network_base_cidr
  subnet_size               = var.subnet_size
  exclude_availablity_zones = var.exclude_availablity_zones
  project                   = var.project
  owner                     = var.owner
  environment               = var.environment
  region                    = var.region
}


