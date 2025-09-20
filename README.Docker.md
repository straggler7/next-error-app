# Docker Setup for IRS Error Resolution App

This document provides instructions for running the IRS Error Resolution application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### Production Build

1. **Build and run with Docker Compose:**
   ```bash
   npm run docker:prod
   ```
   or
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Open your browser and navigate to `http://localhost:4003`

### Development Mode

1. **Run in development mode:**
   ```bash
   npm run docker:dev
   ```
   or
   ```bash
   docker-compose --profile dev up --build
   ```

2. **Features in development mode:**
   - Hot reload enabled
   - Source code mounted as volume
   - Changes reflect immediately

## Manual Docker Commands

### Build the Docker Image

```bash
# Production build
docker build -t irs-error-resolution .

# Development build
docker build -f Dockerfile.dev -t irs-error-resolution-dev .
```

### Run the Container

```bash
# Production
docker run -p 4003:3000 irs-error-resolution

# Development
docker run -p 4003:3000 -v $(pwd):/app -v /app/node_modules irs-error-resolution-dev
```

## Available Scripts

- `npm run docker:build` - Build production Docker image
- `npm run docker:run` - Run production container
- `npm run docker:dev` - Start development environment
- `npm run docker:prod` - Start production environment

## Docker Configuration

### Dockerfile (Production)
- Multi-stage build for optimized image size
- Uses Node.js 18 Alpine for smaller footprint
- Includes security best practices (non-root user)
- Leverages Next.js standalone output for minimal runtime

### Dockerfile.dev (Development)
- Single-stage build for faster development
- Includes all development dependencies
- Supports hot reload and debugging

### docker-compose.yml
- Defines both production and development services
- Uses profiles to separate environments
- Maps port 4003 (host) to 3000 (container)

## Environment Variables

The following environment variables are configured:

- `NODE_ENV`: Set to `production` or `development`
- `PORT`: Internal container port (3000)
- `HOSTNAME`: Set to `0.0.0.0` for Docker networking

## Troubleshooting

### Port Conflicts
If port 4003 is already in use, modify the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "YOUR_PORT:3000"
```

### Build Issues
If you encounter build issues:
1. Clear Docker cache: `docker system prune -a`
2. Rebuild without cache: `docker-compose up --build --force-recreate`

### Development Hot Reload Not Working
Ensure your Docker setup supports file watching:
- On Windows/Mac: Docker Desktop should handle this automatically
- On Linux: You may need to increase `fs.inotify.max_user_watches`

## Production Deployment

For production deployment, consider:
1. Using a reverse proxy (nginx, traefik)
2. Setting up proper logging
3. Configuring health checks
4. Using Docker secrets for sensitive data
5. Setting up monitoring and alerts

## Next Steps

- Configure environment-specific variables
- Set up CI/CD pipeline with Docker
- Add health checks to containers
- Consider using Docker Swarm or Kubernetes for orchestration
