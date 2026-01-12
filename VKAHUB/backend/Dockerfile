FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# These rarely change, so they're cached well
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy ONLY requirements first (for better caching)
# This layer is only rebuilt when requirements.txt changes
COPY requirements.txt .

# Install Python dependencies
# This layer is cached unless requirements.txt changes
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code LAST
# This layer is rebuilt on every code change, but dependencies above are cached
COPY . .

# Create upload directories
RUN mkdir -p /app/static/uploads/avatars \
    /app/static/uploads/team_images \
    /app/static/uploads/competition_images \
    /app/static/uploads/certificates \
    /app/static/uploads/reports_captains \
    /app/static/uploads/reports_generated

# Copy and set permissions for entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Default command (can be overridden)
CMD ["/usr/local/bin/docker-entrypoint.sh"]
