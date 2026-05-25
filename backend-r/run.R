# ============================================
# Run Script - Start the Plumber API
# ============================================

cat("=== Consumer Finance MVP - R Plumber API ===\n")
cat("Starting server...\n\n")

# Set working directory - handle both Docker (/app) and local development
if (dir.exists("/app")) {
  setwd("/app")
} else {
  # Local development - find backend-r directory
  current_dir <- getwd()
  if (basename(current_dir) != "backend-r") {
    setwd(file.path(current_dir, "backend-r"))
  }
}

# Ensure the runtime library path matches the image build path
if (dir.exists("/app/Rlibs")) {
  runtime_lib <- Sys.getenv("R_LIBS_USER", unset = "/app/Rlibs")
} else {
  # Local development - use system R libraries
  runtime_lib <- Sys.getenv("R_LIBS_USER", unset = "")
}

if (runtime_lib != "") {
  .libPaths(c(runtime_lib, .libPaths()))
}
cat("R library paths:\n")
cat(paste0(" - ", .libPaths(), collapse = "\n"), "\n\n", sep = "")

tryCatch({
  # Source DB and initialize
  cat("Loading database module...\n")
  source("R/db.R")
  cat("✓ Database module loaded\n")
  
  cat("Loading utils module...\n")
  source("R/utils.R")
  cat("✓ Utils module loaded\n")
  
  # Initialize database
  cat("Initializing database...\n")
  init_db()
  cat("✓ Database initialized\n")
  
  # Seed admin user if not exists
  cat("Checking admin user...\n")
  admin_exists <- db_exists("users", "email", "admin@finhealth.com")
  if (!admin_exists) {
    cat("Creating admin user...\n")
    library(bcrypt)
    admin_id <- new_uuid()
    admin_hash <- hashpw("admin123")
    db_execute(
      "INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
      params = list(admin_id, "System Admin", "admin@finhealth.com", admin_hash)
    )
    
    # Seed default categories for admin
    source("R/auth.R")
    seed_user_categories(admin_id)
    cat("✓ Admin user created: admin@finhealth.com / admin123\n")
  } else {
    cat("✓ Admin user already exists\n")
  }
  
  # Start plumber
  cat("Loading plumber...\n")
  library(plumber)
  cat("✓ Plumber loaded\n")
  
  cat("Loading API definition...\n")
  pr <- plumber::plumb("plumber.R")
  cat("✓ API definition loaded\n")
  
  cat("\n=== API Starting ===\n")
  port <- as.integer(Sys.getenv("PORT", "8000"))
  cat("URL: http://0.0.0.0:", port, "\n", sep = "")
  cat("Swagger docs: http://0.0.0.0:", port, "/__docs__/\n", sep = "")
  cat("Health check: http://0.0.0.0:", port, "/api/health\n\n", sep = "")
  
  pr$run(host = "0.0.0.0", port = port)
  
}, error = function(e) {
  cat("ERROR:", e$message, "\n")
  cat("Traceback:\n")
  traceback()
  quit(status = 1)
})

