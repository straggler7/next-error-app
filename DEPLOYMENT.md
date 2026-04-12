# Deployment Guide

This document describes how to deploy the IRS Error Resolution Next.js application to various container platforms.

## Prerequisites

- Docker installed locally
- Access to a container registry (GitHub Container Registry, Docker Hub, AWS ECR, etc.)
- Access to a container platform (Azure Container Instances, AWS ECS, Google Cloud Run, Kubernetes, etc.)

## GitHub Actions Workflow

The application includes a comprehensive GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. **Tests** the application (linting, type checking, tests)
2. **Builds** and pushes Docker images to GitHub Container Registry
3. **Deploys** to staging and production environments
4. **Scans** for security vulnerabilities

### Required Secrets

Configure these secrets in your GitHub repository settings:

#### General Secrets
- `GITHUB_TOKEN` (automatically provided)

#### Azure Container Instances
- `AZURE_RG` - Azure Resource Group name

#### AWS ECS (if using)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

#### Environment-specific Secrets
- `DATABASE_URL_STAGING` / `DATABASE_URL_PRODUCTION`
- `API_SECRET_STAGING` / `API_SECRET_PRODUCTION`
- `BYPASS_AUTH_STAGING`
- `NEXT_PUBLIC_DEV_ROLE_STAGING`

## Container Platforms

### 1. Azure Container Instances

The workflow includes Azure Container Instances deployment. To use:

1. Create an Azure Resource Group
2. Set the `AZURE_RG` secret
3. Push to `main` or `develop` branch

### 2. AWS ECS

Uncomment the AWS ECS section in the workflow and:

1. Create an ECS cluster and service
2. Create a task definition file (`task-definition.json`)
3. Set AWS credentials as secrets

### 3. Google Cloud Run

Uncomment the Cloud Run section and:

1. Set up Google Cloud authentication
2. Enable Cloud Run API
3. Configure the service name and region

### 4. Kubernetes

Use the provided Kubernetes manifests in `k8s/deployment.yml`:

```bash
# Apply the manifests
kubectl apply -f k8s/deployment.yml

# Check deployment status
kubectl get pods -l app=irs-error-resolution
kubectl get services
kubectl get ingress
```

## Local Docker Deployment

### Development Build
```bash
# Build the image
docker build -t irs-error-resolution .

# Run the container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e BYPASS_AUTH=false \
  irs-error-resolution
```

### Production with Docker Compose
```bash
# Start the application with nginx reverse proxy
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop the application
docker-compose -f docker-compose.prod.yml down
```

## Environment Variables

### Required Environment Variables
- `NODE_ENV` - Set to `production` for production deployments
- `PORT` - Port number (default: 3000)
- `HOSTNAME` - Hostname to bind to (default: 0.0.0.0)

### Optional Environment Variables
- `BYPASS_AUTH` - Set to `true` to bypass authentication (development only)
- `NEXT_PUBLIC_DEV_ROLE` - Development role (`managers` or `tax_examiners`)
- `DATABASE_URL` - Database connection string
- `API_SECRET` - Secret for API authentication

## Health Checks

The application includes a health check endpoint at `/api/health`. Use this for:

- Container orchestration health checks
- Load balancer health checks
- Monitoring systems

## Security Considerations

### Container Security
- The Docker image runs as a non-root user (nextjs:1001)
- Security headers are configured in nginx
- Rate limiting is implemented
- Minimal attack surface with Alpine Linux base image

### Network Security
- Use HTTPS in production (configure SSL certificates in nginx)
- Implement proper firewall rules
- Use private networks for internal communication

### Secrets Management
- Never commit secrets to version control
- Use container platform secret management
- Rotate secrets regularly

## Monitoring and Logging

### Application Logs
```bash
# Docker logs
docker logs <container-id>

# Kubernetes logs
kubectl logs -l app=irs-error-resolution

# Docker Compose logs
docker-compose logs -f app
```

### Metrics
- Monitor container resource usage (CPU, memory)
- Track application performance metrics
- Set up alerts for critical issues

## Troubleshooting

### Common Issues

1. **Container won't start**
   - Check environment variables
   - Verify image build was successful
   - Check container logs

2. **Application not accessible**
   - Verify port mappings
   - Check firewall rules
   - Ensure health checks are passing

3. **Performance issues**
   - Monitor resource usage
   - Check for memory leaks
   - Optimize container resource limits

### Debug Commands
```bash
# Enter running container
docker exec -it <container-id> /bin/sh

# Check container resource usage
docker stats

# Inspect container configuration
docker inspect <container-id>
```

## Scaling

### Horizontal Scaling
- Increase replica count in Kubernetes deployment
- Use container orchestration auto-scaling features
- Implement load balancing

### Vertical Scaling
- Adjust container resource limits
- Monitor and optimize memory usage
- Consider CPU requirements

## Backup and Recovery

### Database Backups
- Implement regular database backups
- Test backup restoration procedures
- Store backups in secure, separate location

### Application State
- The application is stateless by design
- Session data should be stored externally
- Configuration should be environment-based

## CI/CD Best Practices

1. **Testing**: Always run tests before deployment
2. **Security Scanning**: Scan images for vulnerabilities
3. **Staged Deployments**: Deploy to staging before production
4. **Rollback Strategy**: Have a plan to rollback failed deployments
5. **Monitoring**: Monitor deployments and set up alerts
