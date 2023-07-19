################################################ ALB variables 
variable "alb_https_listener_enabled" {
  type = bool
}
variable "alb_https_listener_ssl_policy" {
  type        = string
  default     = "ELBSecurityPolicy-2016-08"
  description = "SSL security Protocol."
}

variable "alb_https_listener_ssl_certificate_arn" {
  type        = string
  default     = "arn:aws:acm:us-east-1:202707406398:certificate/e763a83d-2df1-416b-a2af-df7f61ac65f6"
  description = "SSL certificate ARN"
}

variable "internal" {
  type        = bool
  default     = false
  description = "public or private ALB"
}

variable "health_check_devnet" {
  type = map(any)
  default = {
    "path"                = "/api/v4/system/ping"
    "healthy_threshold"   = 5
    "interval"            = 120
    "timeout"             = 60
    "unhealthy_threshold" = 2
    "port"                = 8065
  }
}

variable "health_check_rocket" {
  type = map(any)
  default = {
    "path"                = "/api/v4/system/ping"
    "healthy_threshold"   = 5
    "interval"            = 120
    "timeout"             = 60
    "unhealthy_threshold" = 2
    "port"                = 8065
  }
}

variable "health_check_remix" {
  type = map(any)
  default = {
    "path"                = "/api/v4/system/ping"
    "healthy_threshold"   = 5
    "interval"            = 120
    "timeout"             = 60
    "unhealthy_threshold" = 2
    "port"                = 8065
  }
}

variable "aws_lb_target_group" {}

variable "alb_http_listener_port" {
  type        = string
  default     = "80"
  description = "(optional) describe your variable"
}

variable "alb_http_listener_protocol" {
  type        = string
  default     = "HTTP"
  description = "(optional) describe your variable"
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
