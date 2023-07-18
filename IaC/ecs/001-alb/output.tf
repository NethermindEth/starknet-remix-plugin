output "alb_target_group_arn_remix" {
  value = module.alb.target_group_arn
}

output "alb_target_group_arn_rocket" {
  value = module.alb-2.target_group_arn
}

output "alb_target_group_arn_devnet" {
  value = module.alb-3.target_group_arn
}

output "lb_ecs_sg" {
  value = module.loadbalancer_ecs_sg.id
}

output "ecs_sg" {
  value = module.ecs_sg.id
}

