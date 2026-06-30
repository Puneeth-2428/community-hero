# Security Group for Database & Cache
resource "aws_security_group" "data_tier" {
  name        = "community-hero-data-sg"
  description = "Allow ECS access to Postgres and Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "community-hero-db-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "community-hero-db"
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.medium"
  db_name              = "communityhero"
  username             = "dbadmin"
  password             = random_password.db_password.result
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.data_tier.id]
  multi_az             = true
  skip_final_snapshot  = false
  storage_encrypted    = true
}

resource "random_password" "db_password" {
  length  = 16
  special = false
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "community-hero-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "community-hero-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.data_tier.id]
}
