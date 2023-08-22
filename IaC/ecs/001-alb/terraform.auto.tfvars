################################################### Common Tfvars
project     = "starknet-remix"
environment = "development"
region      = "us-east-2"
owner       = "DevOps"

################################################ ALB variables 
alb_https_listener_enabled             = false
alb_https_listener_ssl_policy          = "ELBSecurityPolicy-2016-08"
alb_https_listener_ssl_certificate_arn = "arn:aws:acm:us-east-1:603392552805:certificate/b58d2a77-50be-4dc7-904a-968480133652"

aws_lb_target_group = {
  rocket = {
    health_check = {
      "path"                = "/health"
      "healthy_threshold"   = 5
      "interval"            = 120
      "timeout"             = 60
      "unhealthy_threshold" = 2
      "port"                = 8000
    }
    target_group_name = "starknet-remix-dev-rocket-tg"
    host_header      = ["cairo-remix-rocket.nethermind.io"]
    priority          = 200
  },
  devnet = {
    health_check = {
      "path"                = "/is_alive"
      "healthy_threshold"   = 5
      "interval"            = 120
      "timeout"             = 60
      "unhealthy_threshold" = 2
      "port"                = 5050
    }
    target_group_name = "starknet-remix-dev-devnet-tg"
    host_header      = ["cairo-remix-devnet.nethermind.io"]
    priority          = 100
  }
}