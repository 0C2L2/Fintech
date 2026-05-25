# Backend Dockerfile - R Plumber API
FROM rocker/r-ver:4.3.1
LABEL maintainer=""
WORKDIR /app

# Install system build dependencies needed for compiling R packages
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	libssl-dev \
	libcurl4-openssl-dev \
	libxml2-dev \
	libgmp-dev \
	&& rm -rf /var/lib/apt/lists/*

# Create a private R library path inside the image and use it
RUN mkdir -p /app/Rlibs
ENV R_LIBS_USER=/app/Rlibs

# Copy and run package installer to ensure packages match the base R version
COPY install_packages.R /app/install_packages.R
RUN Rscript /app/install_packages.R

# Copy backend R code
COPY R /app/R
COPY plumber.R /app/plumber.R
COPY run.R /app/run.R
COPY *.R /app/

# Copy database schema
COPY schema.sql /app/schema.sql

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080

CMD ["/app/entrypoint.sh"]
