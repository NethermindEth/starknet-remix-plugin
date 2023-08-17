output "task_definition_arn" {
  value = values(module.task_definition).*.task_definition_arn
}

output "task_definition_family" {
  value = values(module.task_definition).*.family
}