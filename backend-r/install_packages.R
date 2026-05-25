# ============================================
# Install Required R Packages
# ============================================

cat("Installing required R packages for Consumer Finance MVP...\n\n")

# For Docker use /app/Rlibs, for local development use default R libraries
if (dir.exists("/app")) {
  lib_path <- Sys.getenv("R_LIBS_USER", unset = "/app/Rlibs")
  dir.create(lib_path, recursive = TRUE, showWarnings = FALSE)
  .libPaths(c(lib_path, .libPaths()))
} else {
  # Local development - use default R library path
  lib_path <- .libPaths()[1]
  cat("Local development mode - using default R library path\n")
}

cat(sprintf("Using R library path: %s\n\n", lib_path))

packages <- c(
  "plumber",
  "DBI",
  "RSQLite",
  "bcrypt",
  "jose",
  "uuid",
  "jsonlite",
  "dplyr",
  "tidyr",
  "lubridate",
  "randomForest",
  "cluster",
  "openxlsx"
)

for (pkg in packages) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    cat(sprintf("Installing %s...\n", pkg))
    install.packages(pkg, repos = "https://cran.r-project.org", lib = lib_path, dependencies = TRUE)
  } else {
    cat(sprintf("%s is already installed.\n", pkg))
  }
}

cat("\nAll packages installed successfully!\n")
cat("You can now run the API with: Rscript run.R\n")
