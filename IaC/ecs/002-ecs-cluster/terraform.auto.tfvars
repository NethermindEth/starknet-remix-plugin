################################################### Common Tfvars
project     = "starknet-remix"
environment = "development"
region      = "us-east-2"
owner       = "DevOps"

################################################### ECS
ecs_cluster_name = "starknet-remix-plugin-ecs-cluster"
launch_type_ec2  = true
###################################################capacity provider variables

default_capacity_provider_strategy_base   = 0
default_capacity_provider_strategy_weight = 1
ecs_instance_access_key_name              = "ec2-ssh-key-1"
ssh_public_key                            = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDLpYr3tw5yHTsWgsQ8kxFVSWsHCSa4iHk3cf45DxdTGLm8s+V01naWzDd3V7NPL9zx3SLSGEfUnbg5mbZ0i4TJNsQROAP1YDCBglg0g0hvv8WIakuGEk/DMb4ElYUraIZpNQPi9yXBTMVnoRYREorZDk+Ax7sy6TsaWCKWuZnysJJtp7GHDnMCH54x6WrEb6rQWiPj54WGzXvGLrIzpGrQU0VMtllpWjLfvb8ZT0ouGxMYz9v+oXbqMmvpMaceVZ/uDnTKKaHqMX+jQLPUO9H69UvY5nPQkB4kBHfmQH7Qyd1EgQbMP5mQ6FyZjzllWrU+6JchaRTNQ43s+SPfVGUZyKMGae6/DBtrl7VXLNOXJCUYgqMHQnGmBGQdVbOIX8vKUIof4m+0Yl12qkzbRmgh9BeCqbQZDaQgqLaK77QlUZvz73n0yIed1W+2fv4F9DfZlrn/JcQB3nErboO0/4Zabmi0UD2sZrrYcrBOQuW2Csi/Kon8yg+Hho5ZFiLjKS8= anishgehlot@Anishs-MacBook-Pro.local"

####################################################launch configuration variables

lc_instance_type = "t3.small"
lc_volume_size   = 30
lc_volume_type   = "gp2"

##################################################Auto scaling groups variables
asg_min_size         = 1
asg_max_size         = 3
asg_desired_capacity = 1


