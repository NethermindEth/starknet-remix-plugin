output "ecs-cluster-name" {
  value       = var.launch_type_ec2 ? module.ecs_cluster_ec2.0.ecs_cluster_name : module.ecs_cluster_fargate.0.ecs_cluster_name
  description = "Cluster name."
}

output "ecs_cluster_id" {
  value       = var.launch_type_ec2 ? module.ecs_cluster_ec2.0.ecs_cluster_id : module.ecs_cluster_fargate.0.ecs_cluster_id
  description = "Cluster ID."
}

output "autoscaling_arn" {
  value = module.asg.*.autoscaling_arn
}

output "log_group_id" {
  value = module.ecs_service_log_group.log_group_id
}

output "iam_instance_profile_arn" {
  value       = aws_iam_instance_profile.ecs.arn
  description = "IAM instance profile ARN."
}

output "iam_instance_profile_name" {
  value       = aws_iam_instance_profile.ecs.name
  description = "IAM instance profile name."
}

output "iam_instance_role_name" {
  value       = aws_iam_role.ecs.name
  description = "IAM instance role name."
}

output "iam_ecs_task_execution_role_arn" {
  value = aws_iam_role.ecsTaskExecutionRole.arn
}

output "arn" {
  value       = var.launch_type_ec2 ? module.ecs_cluster_ec2.0.ecs_cluster_arn : module.ecs_cluster_fargate.0.ecs_cluster_arn
  description = "Cluster ARN."
}
