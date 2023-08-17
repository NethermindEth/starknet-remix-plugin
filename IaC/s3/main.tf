resource "aws_s3_bucket" "website_bucket" {
  bucket = local.bucket_name
  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
  tags = local.tags
}

resource "aws_s3_bucket_ownership_controls" "website_bucket" {
  bucket = aws_s3_bucket.website_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_policy" "policy" {
  bucket = aws_s3_bucket.website_bucket.id
  policy = templatefile("policy.json", { bucket = local.bucket_name })
}

resource "aws_s3_bucket_public_access_block" "public" {
  bucket = aws_s3_bucket.website_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "acl" {
  depends_on = [
    aws_s3_bucket_ownership_controls.website_bucket,
    aws_s3_bucket_public_access_block.public,
  ]

  bucket = aws_s3_bucket.website_bucket.id
  acl    = "public-read"
}