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

variable "ecr_repository" {
  type = string
  description = "Name of the ECR repository to allow access to"
}

variable "cluster_names" {
  type = list(string)
  description = "List of the names of the EKS clusters to allow rollout access to"
}


data "aws_caller_identity" "current" {}

provider "aws" {
  profile = var.aws_profile
  region  = var.aws_region
}

# Step 1
resource "aws_iam_policy" "push_image_policy" {
  name        = "DeployPushImage"
  description = "Allow CI/CD pipeline to push images to ECR"

  policy = data.aws_iam_policy_document.ecr.json
}

data "aws_iam_policy_document" "ecr" {
  statement {
    actions   = [
        "ecr:CreateRepository",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:CompleteLayerUpload",
        "ecr:TagResource",
        "ecr:UploadLayerPart",
        "ecr:ListImages",
        "ecr:InitiateLayerUpload",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetRepositoryPolicy",
        "ecr:PutImage"
    ]
    resources = ["arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${var.ecr_repository}", "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${var.ecr_repository}-stages"]
    effect    = "Allow"
  }

  statement {
    actions   = [
        "ecr:DescribeRegistry",
        "ecr:GetAuthorizationToken"
    ]
    resources = ["*"]
    effect    = "Allow"
  }
}

# Step 2
resource "aws_iam_policy" "rollout_image_policy" {
  name        = "DeployRolloutImage"
  description = "Allow CI/CD pipeline to rollout images on a cluster"

  policy = data.aws_iam_policy_document.rollout.json
}

data "aws_iam_policy_document" "rollout" {
  statement {
    actions   = [
        "eks:AccessKubernetesApi",
        "ecr:BatchGetImage",
        "eks:DescribeCluster"
    ]
    resources = concat(
      [for cluster in var.cluster_names : "arn:aws:eks:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/${cluster}"],
      ["arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${var.ecr_repository}"]
    )
    effect    = "Allow"
  }

  statement {
    actions   = [
        "eks:ListClusters",
    ]
    resources = ["*"]
    effect    = "Allow"
  }
}

# Step 3
resource "aws_iam_policy" "secrets_manager_access_policy" {
  name        = "DeploySecretsManagerAccess"
  description = "Allow CI/CD pipeline to access secrets stored in Secrets Manager"

  policy = data.aws_iam_policy_document.secretsManager.json
}

data "aws_iam_policy_document" "secretsManager" {
  statement {
    actions   = [
        "secretsmanager:GetResourcePolicy",
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:ListSecretVersionIds"
    ]
    resources = ["arn:aws:secretsmanager:*:${data.aws_caller_identity.current.account_id}:secret:*"]
    effect    = "Allow"
  }

  statement {
    actions   = [
        "secretsmanager:GetRandomPassword",
        "secretsmanager:ListSecrets",
    ]
    resources = ["*"]
    effect    = "Allow"
  }
}

# Step 4
resource "aws_iam_user" "deploy_service_account_user" {
  name = "DeployServiceAccount"
}

resource "aws_iam_access_key" "deploy_service_account_user" {
  user = aws_iam_user.deploy_service_account_user.name
}

# Step 5
resource "aws_iam_user_policy_attachment" "attach_push_policy" {
  depends_on = [
      aws_iam_user.deploy_service_account_user,
      aws_iam_policy.push_image_policy
  ]
  user       = aws_iam_user.deploy_service_account_user.name
  policy_arn = aws_iam_policy.push_image_policy.arn
}
resource "aws_iam_user_policy_attachment" "attach_rollout_policy" {
  depends_on = [
      aws_iam_user.deploy_service_account_user,
      aws_iam_policy.rollout_image_policy
  ]
  user       = aws_iam_user.deploy_service_account_user.name
  policy_arn = aws_iam_policy.rollout_image_policy.arn
}
resource "aws_iam_user_policy_attachment" "attach_secrets_policy" {
  depends_on = [
      aws_iam_user.deploy_service_account_user,
      aws_iam_policy.secrets_manager_access_policy
  ]
  user       = aws_iam_user.deploy_service_account_user.name
  policy_arn = aws_iam_policy.secrets_manager_access_policy.arn
}

# Output
output "user_arn" {
 value = "${aws_iam_user.deploy_service_account_user.arn}"
}

output "access_key_id" {
  value = aws_iam_access_key.deploy_service_account_user.id
}

output "access_key_secret" {
  value = aws_iam_access_key.deploy_service_account_user.secret
  sensitive = true
}
