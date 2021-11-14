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

variable "cluster_name" {
  type = string
  description = "Name of cluster. Used in policy and role names."
}

variable "oidc_issuer" {
  type = string
  description = "Run aws eks describe-cluster --profile=*profile* --name *name* --query \"cluster.identity.oidc.issuer\" --output text | sed -e \"s/^https:\\/\\///\""
}

data "aws_caller_identity" "current" {}

provider "aws" {
  profile = var.aws_profile
  region  = var.aws_region
}

# Step 1
resource "null_resource" "associate_iam_oidc_provider" {
  provisioner "local-exec" {
    command = "eksctl utils associate-iam-oidc-provider --profile=${var.aws_profile} --region=${var.aws_region} --cluster=${var.cluster_name} --approve"
  }
}

# Step 2
resource "aws_iam_policy" "policy" {
  depends_on  = [null_resource.associate_iam_oidc_provider]

  name        = "${var.cluster_name}-secrets-policy"
  description = "${var.cluster_name} Secrets Manager Access Policy"

  policy = data.aws_iam_policy_document.secretsManager.json
}

data "aws_iam_policy_document" "secretsManager" {
  statement {
    actions   = ["secretsmanager:GetResourcePolicy", "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "secretsmanager:ListSecretVersionIds"]
    resources = ["arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:*"]
    effect    = "Allow"
  }
}

# Step 3
resource "aws_iam_role" "role" {
  depends_on = [aws_iam_policy.policy]
  name       = "${var.cluster_name}-secrets-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
        {
            Effect: "Allow",
            Principal: {
                Federated: "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${var.oidc_issuer}"
            },
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
                StringEquals: {
                    "${var.oidc_issuer}:aud": "sts.amazonaws.com",
                    "${var.oidc_issuer}:sub": "system:serviceaccount:default:external-secrets-kubernetes-external-secrets"
                }
            }
        }    
    ]
  })
}

# Step 4
resource "aws_iam_role_policy_attachment" "attachment" {
  depends_on = [aws_iam_policy.policy]
  role       = aws_iam_role.role.name
  policy_arn = aws_iam_policy.policy.arn
}

output "role_arn" {
  value = aws_iam_role.role.arn
}