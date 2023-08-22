output "alb_target_group_arn" {
  value = module.alb.target_group_arn
}

output "lb_ecs_sg" {
  value = module.loadbalancer_ecs_sg.id
}

output "alb_target_group_arn-01" {
  value = values(aws_lb_target_group.default).*.arn
}
output "ecs_sg" {
  value = module.ecs_sg.id
}

