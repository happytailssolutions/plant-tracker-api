# Plant Tracker API - Docker Setup

This directory contains Docker configuration files for running the Plant Tracker API backend with PostgreSQL database.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

## Quick Start

1. **Navigate to the API directory:**
   ```bash
   cd plant-tracker-api
   ```

2. **Build and start the services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - API: http://localhost:3000
   - PostgreSQL: localhost:5432

## Services

### API Service
- **Port:** 3000
- **Container:** plant-tracker-api
- **Image:** Built from local Dockerfile
- **Environment:** Development mode with hot reload

### PostgreSQL Database
- **Port:** 5432
- **Container:** plant-tracker-postgres
- **Image:** postgres:15-alpine
- **Database:** plant_tracker
- **User:** plant_user
- **Password:** plant_password

## Useful Commands

### Start services in background
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs api
docker-compose logs postgres
```

### Stop services
```bash
docker-compose down
```

### Stop services and remove volumes (WARNING: This will delete all data)
```bash
docker-compose down -v
```

### Rebuild and restart
```bash
docker-compose up --build --force-recreate
```

### Access PostgreSQL directly
```bash
docker-compose exec postgres psql -U plant_user -d plant_tracker
```

### Access API container shell
```bash
docker-compose exec api sh
```

## Environment Variables

The following environment variables are configured:

- `NODE_ENV`: development
- `PORT`: 3000
- `DATABASE_URL`: postgresql://plant_user:plant_password@postgres:5432/plant_tracker

## Data Persistence

PostgreSQL data is persisted in a Docker volume named `postgres_data`. This ensures your data survives container restarts.

## Health Checks

Both services include health checks:
- **PostgreSQL:** Checks if the database is ready to accept connections
- **API:** Checks if the application is responding on the health endpoint

## Troubleshooting

### Port conflicts
If ports 3000 or 5432 are already in use, you can modify the `docker-compose.yml` file to use different ports.

### Database connection issues
Ensure the PostgreSQL container is healthy before the API tries to connect. The API service is configured to wait for the database to be ready.

### Build issues
If you encounter build issues, try:
```bash
docker-compose down
docker system prune -f
docker-compose up --build
```

## Development Workflow

1. Make changes to your code
2. Rebuild the API container: `docker-compose up --build api`
3. Or restart the entire stack: `docker-compose up --build`

## Production Considerations

For production deployment:
1. Change `NODE_ENV` to `production`
2. Use proper secrets management for database credentials
3. Configure SSL for database connections
4. Set up proper logging and monitoring
5. Consider using a reverse proxy (nginx) in front of the API 