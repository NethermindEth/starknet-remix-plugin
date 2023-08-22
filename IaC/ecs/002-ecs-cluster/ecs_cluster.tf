
module "aws_key_pair" {
  count                        = var.launch_type_ec2 ? 1 : 0
  source                       = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/ssh-key_module?ref=v0.0.1-rc.1"
  ecs_instance_access_key_name = var.ecs_instance_access_key_name
  ssh_public_key               = var.ssh_public_key
  tags                         = local.tags
}

module "ecs_launch_configuration" {
  count                   = var.launch_type_ec2 ? 1 : 0
  source                  = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/launch-template?ref=v0.0.1-rc.1"
  lc_iam_instance_profile = aws_iam_instance_profile.ecs.name
  lc_image_id             = data.aws_ami.ecs.id
  lc_instance_type        = var.lc_instance_type
  lc_key_name             = module.aws_key_pair.0.ec2_access_ssh_key_name
  lc_name_prefix          = "${var.project}-lc-"
  lc_volume_size          = var.lc_volume_size
  lc_volume_type          = var.lc_volume_type
  lc_user_data            = base64encode(templatefile("./user_data.sh.tpl", { ecs_cluster_name = var.ecs_cluster_name }))
  lc_security_groups      = ["${data.terraform_remote_state.ecs_alb.outputs.lb_ecs_sg}"]
}

module "asg" {
  count                     = var.launch_type_ec2 ? 1 : 0
  source                    = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/asg?ref=v0.0.1-rc.1"
  asg_name                  = "${var.project}-${var.environment}-asg"
  asg_health_check_type     = var.asg_health_check_type
  asg_max_size              = var.asg_max_size
  asg_min_size              = var.asg_min_size
  asg_desired_capacity      = var.asg_desired_capacity
  asg_protect_from_scale_in = var.asg_protect_from_scale_in
  launch_template           = module.ecs_launch_configuration.0.launch_template_name
  vpc_zone_identifier       = data.aws_subnets.private.ids
  depends_on                = [module.ecs_launch_configuration]
}

module "ecs_cluster_ec2" {
  count                                     = var.launch_type_ec2 ? 1 : 0
  source                                    = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/ecs-cluster?ref=v0.0.1-rc.1"
  launch_type_ec2                           = var.launch_type_ec2
  ecs_cluster_name                          = var.ecs_cluster_name
  aws_ecs_capacity_provider_name            = module.asg.0.autoscaling_name
  auto_scaling_group_arn                    = module.asg.0.autoscaling_arn
  default_capacity_provider_strategy_base   = var.default_capacity_provider_strategy_base
  default_capacity_provider_strategy_weight = var.default_capacity_provider_strategy_weight
  tags                                      = local.tags
}

######### Fargate

module "ecs_cluster_fargate" {
  count                                     = var.launch_type_ec2 ? 0 : 1
  source                                    = "git::ssh://git@github.com/NethermindEth/nm-terraform-modules.git//modules/aws/ecs-cluster?ref=v0.0.1-rc.1"
  launch_type_ec2                           = var.launch_type_ec2
  ecs_cluster_name                          = var.ecs_cluster_name
  default_capacity_provider_strategy_base   = var.default_capacity_provider_strategy_base
  default_capacity_provider_strategy_weight = var.default_capacity_provider_strategy_weight
  target_capacity                           = var.target_capacity
  tags                                      = local.tags
}