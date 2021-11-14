terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }

  required_version = ">= 0.14.9"
}

variable "aws_profile" {
  type = string
  description = "AWS profile to use"
}

variable "aws_region" {
  type = string
  description = "AWS region to use"
}

variable "staging_vpc_id" {
  type = string
  description = "ID of staging cluster VPC"
}

variable "project_name" {
  type = string
  description = "Name of project. e.g. limelight"
}

data "aws_caller_identity" "current" {}

provider "aws" {
  profile = var.aws_profile
  region  = var.aws_region
}


# Step 1 - Staging DB password
resource "random_string" "staging_password" {
  length           = 16
  special          = true
  override_special = "£$"
}

data "aws_subnet_ids" "staging_vpc_subnets" {
  vpc_id = var.staging_vpc_id
}

# Step 2 - VPC Security Group
resource "aws_security_group" "staging_sg" {
  name        = "${var.project_name}-staging-sg"

  description = "Security group for ${var.project_name} staging database"
  vpc_id      = var.staging_vpc_id


  # Only Postgres in
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
  }

  # Allow all outbound traffic.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
  }
}

resource "aws_db_subnet_group" "staging_subnet_group" {
  name       = "${var.project_name}-staging"
  subnet_ids = data.aws_subnet_ids.staging_vpc_subnets.ids
}

# Step 3 - Staging setup
resource "aws_rds_cluster" "staging_database" {
  cluster_identifier      = "${var.project_name}-staging"
  engine                  = "aurora-postgresql"
  database_name           = var.project_name
  master_username         = var.project_name
  master_password         = random_string.staging_password.result
  backup_retention_period = 5
  apply_immediately       = true
  vpc_security_group_ids  = [ "${aws_security_group.staging_sg.id}" ]
  db_subnet_group_name    = aws_db_subnet_group.staging_subnet_group.id
}

resource "aws_rds_cluster_instance" "staging_instances" {
  count                = 1
  identifier           = "${var.project_name}-staging-${count.index}"
  cluster_identifier   = aws_rds_cluster.staging_database.id
  instance_class       = "db.t3.medium"
  engine               = aws_rds_cluster.staging_database.engine
  engine_version       = aws_rds_cluster.staging_database.engine_version
  publicly_accessible  = true
  db_subnet_group_name = aws_db_subnet_group.staging_subnet_group.id
}

# Step 3 - Production DB password
# resource "random_string" "prod_password" {
#   length           = 16
#   special          = true
#   override_special = "/@£$"
# }

# Step 4 - Production setup
# resource "aws_rds_cluster" "prod_database" {
#   cluster_identifier      = "${var.project_name}-prod"
#   engine                  = "aurora-postgresql"
#   engine_mode             = "serverless"
#   database_name           = var.project_name
#   master_username         = var.project_name
#   master_password         = random_string.staging_password.result
#   backup_retention_period = 5
#   apply_immediately       = true
# }

output "staging_db_password" {
  value = random_string.staging_password
  sensitive = true
}
