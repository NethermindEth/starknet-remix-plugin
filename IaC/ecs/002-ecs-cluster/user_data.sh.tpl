#!/bin/bash
echo ECS_CLUSTER="${ecs_cluster_name}" >> /etc/ecs/ecs.config;echo ECS_BACKEND_HOST= >> /etc/ecs/ecs.config;
sudo yum install amazon-cloudwatch-agent -y
touch cwagent.json
echo '{"agent":{"metrics_collection_interval":60,"run_as_user":"cwagent"},"metrics":{"append_dimensions":{"AutoScalingGroupName":"$${aws:AutoScalingGroupName}","ImageId":"$${aws:ImageId}","InstanceId":"$${aws:InstanceId}","InstanceType":"$${aws:InstanceType}"},"metrics_collected":{"disk":{"measurement":["used_percent"],"metrics_collection_interval":60,"resources":["/"]},"mem":{"measurement":["mem_used_percent"],"metrics_collection_interval":60}}}}' > cwagent.json 
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:./cwagent.json -s
sudo systemctl restart amazon-cloudwatch-agent.service