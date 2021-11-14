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

variable "aws_account_number" {
  type = string
  description = "AWS account number"
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

# Step 1 - Create policy
resource "aws_iam_policy" "api_service_policy" {
  name        = "APIServicePolicy"
  path        = "/"
  description = "Policy to allow ${var.project_name} API access to AWS services"

  # Terraform's "jsonencode" function converts a
  # Terraform expression result to valid JSON syntax.
  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObjectAcl",
                "secretsmanager:GetResourcePolicy",
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:PutObjectAcl",
                "secretsmanager:ListSecretVersionIds"
            ],
            "Resource": [
                "arn:aws:s3:::${var.project_name}-media/*",
                "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_number}:secret:*"
            ]
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "sns:DeleteSMSSandboxPhoneNumber",
                "sns:DeleteTopic",
                "sns:CreatePlatformApplication",
                "sns:SetSMSAttributes",
                "sns:CreateTopic",
                "sns:CreatePlatformEndpoint",
                "sns:Unsubscribe",
                "sns:SetTopicAttributes",
                "sns:OptInPhoneNumber",
                "sns:DeleteEndpoint",
                "sns:SetEndpointAttributes",
                "secretsmanager:GetRandomPassword",
                "sns:SetSubscriptionAttributes",
                "sns:Publish",
                "sns:DeletePlatformApplication",
                "sns:CreateSMSSandboxPhoneNumber",
                "sns:SetPlatformApplicationAttributes",
                "sns:VerifySMSSandboxPhoneNumber",
                "sns:Subscribe",
                "sns:ConfirmSubscription",
                "geo:*",
                "secretsmanager:ListSecrets"
            ],
            "Resource": "*"
        }
    ]
  })
}

# Step 2 - Staging account
resource "aws_iam_user" "staging_account" {
  name = "StagingServiceAccount"

  tags = {
    env = "staging"
  }
}

resource "aws_iam_user_policy_attachment" "staging_account_attach" {
  user       = aws_iam_user.staging_account.name
  policy_arn = aws_iam_policy.api_service_policy.arn
}

resource "aws_iam_access_key" "staging_account_access_key" {
  user = aws_iam_user.staging_account.name
}

output "staging_access_key_id" {
  value       = aws_iam_access_key.staging_account_access_key.id
  description = "Access Key ID - Staging"
}

output "staging_access_key_secret" {
  value       = aws_iam_access_key.staging_account_access_key.secret
  description = "Access Key Secret - Staging"
  sensitive   = true
}

# Step 3 - Production account
resource "aws_iam_user" "prod_account" {
  name = "ProdServiceAccount"

  tags = {
    env = "prod"
  }
}

resource "aws_iam_user_policy_attachment" "prod_account_attach" {
  user       = aws_iam_user.prod_account.name
  policy_arn = aws_iam_policy.api_service_policy.arn
}

resource "aws_iam_access_key" "prod_account_access_key" {
  user = aws_iam_user.prod_account.name
}

output "prod_access_key_id" {
  value       = aws_iam_access_key.prod_account_access_key.id
  description = "Access Key ID - Production"
}

output "prod_access_key_secret" {
  value       = aws_iam_access_key.prod_account_access_key.secret
  description = "Access Key Secret - Production"
  sensitive   = true
}