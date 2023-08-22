[
    {
        "name": "${container_name}",
        "image": "${image}","cpu": 0,
        "portMappings": [
            {
                "containerPort": ${container_port},
                "hostPort": ${host_port},
                "protocol": "tcp"
            }
        ],
        "essential": true,
        "environment": [],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "${aws_log_group}",
                "awslogs-region": "${aws_log_group_region}",
                "awslogs-stream-prefix": "${aws_log_stream_prefix}"
            }
        }
    }
]
