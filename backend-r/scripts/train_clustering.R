# ============================================
# Training Script: K-Means Clustering Model
# ============================================

library(cluster)

cat("=== Training K-Means Clustering Model ===\n\n")

# Generate synthetic training data
set.seed(42)
n <- 500

# Simulate different spending patterns
generate_pattern <- function(n, label) {
  switch(label,
    "balanced" = data.frame(
      rent_share = rnorm(n, 0.30, 0.05),
      food_share = rnorm(n, 0.20, 0.04),
      transport_share = rnorm(n, 0.12, 0.03),
      education_share = rnorm(n, 0.08, 0.03),
      entertainment_share = rnorm(n, 0.10, 0.03),
      savings_rate = rnorm(n, 0.18, 0.05)
    ),
    "high_saver" = data.frame(
      rent_share = rnorm(n, 0.25, 0.05),
      food_share = rnorm(n, 0.15, 0.03),
      transport_share = rnorm(n, 0.10, 0.02),
      education_share = rnorm(n, 0.05, 0.02),
      entertainment_share = rnorm(n, 0.05, 0.02),
      savings_rate = rnorm(n, 0.35, 0.08)
    ),
    "rent_burdened" = data.frame(
      rent_share = rnorm(n, 0.50, 0.06),
      food_share = rnorm(n, 0.18, 0.04),
      transport_share = rnorm(n, 0.10, 0.03),
      education_share = rnorm(n, 0.05, 0.02),
      entertainment_share = rnorm(n, 0.07, 0.02),
      savings_rate = rnorm(n, 0.08, 0.04)
    ),
    "entertainment_heavy" = data.frame(
      rent_share = rnorm(n, 0.25, 0.05),
      food_share = rnorm(n, 0.18, 0.04),
      transport_share = rnorm(n, 0.10, 0.03),
      education_share = rnorm(n, 0.05, 0.02),
      entertainment_share = rnorm(n, 0.28, 0.06),
      savings_rate = rnorm(n, 0.10, 0.04)
    )
  )
}

# Generate data for each pattern
data <- rbind(
  generate_pattern(n/4, "balanced"),
  generate_pattern(n/4, "high_saver"),
  generate_pattern(n/4, "rent_burdened"),
  generate_pattern(n/4, "entertainment_heavy")
)

# Clamp values to valid ranges
data <- as.data.frame(lapply(data, function(x) pmax(0, pmin(1, x))))

cat(sprintf("Training data: %d samples, %d features\n", nrow(data), ncol(data)))

# Scale features
scaled_data <- scale(data)
scaler_params <- list(
  center = attr(scaled_data, "scaled:center"),
  scale = attr(scaled_data, "scaled:scale")
)

# Train K-Means with k=4
cat("Training K-Means with k=4...\n")
set.seed(42)
km_model <- kmeans(scaled_data, centers = 4, nstart = 25, iter.max = 100)

cat(sprintf("Cluster sizes: %s\n", paste(km_model$size, collapse = ", ")))
cat(sprintf("Total within-cluster SS: %.2f\n", km_model$tot.withinss))

# Save model and scaler
models_dir <- file.path(dirname(getwd()), "backend-r", "models")
dir.create(models_dir, showWarnings = FALSE, recursive = TRUE)

saveRDS(km_model, file.path(models_dir, "kmeans_model.rds"))
saveRDS(scaler_params, file.path(models_dir, "scaler_params.rds"))

cat("\nModel saved to models/kmeans_model.rds\n")
cat("Scaler saved to models/scaler_params.rds\n")

# Print cluster centers (unscaled)
cat("\nCluster centers (original scale):\n")
centers_unscaled <- sweep(km_model$centers, 2, scaler_params$scale, "*")
centers_unscaled <- sweep(centers_unscaled, 2, scaler_params$center, "+")
print(round(centers_unscaled, 3))

cat("\n=== Training Complete ===\n")
