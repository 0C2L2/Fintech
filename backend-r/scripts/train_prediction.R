# ============================================
# Training Script: Random Forest Savings Prediction
# ============================================

library(randomForest)

cat("=== Training Random Forest Savings Prediction Model ===\n\n")

# Generate synthetic training data
set.seed(123)
n <- 1000

# Simulate monthly financial features
data <- data.frame(
  income = runif(n, 1500, 8000),
  total_expense = runif(n, 800, 6000),
  rent_share = runif(n, 0.15, 0.55),
  food_share = runif(n, 0.08, 0.35),
  transport_share = runif(n, 0.03, 0.25),
  education_share = runif(n, 0, 0.15),
  entertainment_share = runif(n, 0.02, 0.35),
  savings_rate = runif(n, -0.1, 0.45),
  expense_growth = rnorm(n, 0.02, 0.15),
  avg_savings_last_3m = runif(n, 0, 2000)
)

# Target: next month savings (simulated)
# Savings is influenced by income, expenses, savings rate, and momentum
data$next_month_savings <- with(data, {
  base_savings <- income - total_expense
  momentum <- avg_savings_last_3m * 0.3
  noise <- rnorm(n, 0, 150)
  pmax(0, base_savings * 0.6 + momentum * 0.3 + noise)
})

cat(sprintf("Training data: %d samples\n", nrow(data)))
cat(sprintf("Target range: $%.0f - $%.0f\n", min(data$next_month_savings), max(data$next_month_savings)))

# Split 80/20
set.seed(42)
train_idx <- sample(n, 0.8 * n)
train_data <- data[train_idx, ]
test_data <- data[-train_idx, ]

# Train Random Forest
cat("\nTraining Random Forest (ntree=200)...\n")
rf_model <- randomForest(
  next_month_savings ~ income + total_expense + rent_share + food_share + 
    transport_share + education_share + entertainment_share + 
    savings_rate + expense_growth + avg_savings_last_3m,
  data = train_data,
  ntree = 200,
  mtry = 4,
  importance = TRUE
)

# Evaluate
predictions <- predict(rf_model, test_data)
actual <- test_data$next_month_savings

rmse <- sqrt(mean((predictions - actual)^2))
mae <- mean(abs(predictions - actual))
r_squared <- 1 - sum((actual - predictions)^2) / sum((actual - mean(actual))^2)

cat(sprintf("\nTest Results:\n"))
cat(sprintf("  RMSE: $%.2f\n", rmse))
cat(sprintf("  MAE:  $%.2f\n", mae))
cat(sprintf("  R²:   %.4f\n", r_squared))

# Feature importance
cat("\nFeature Importance:\n")
imp <- importance(rf_model)
imp_sorted <- sort(imp[, "%IncMSE"], decreasing = TRUE)
for (name in names(imp_sorted)) {
  cat(sprintf("  %s: %.2f\n", name, imp_sorted[name]))
}

# Also train a simple linear model for comparison
cat("\nTraining Linear Regression for comparison...\n")
lm_model <- lm(
  next_month_savings ~ income + total_expense + rent_share + food_share + 
    transport_share + education_share + entertainment_share + 
    savings_rate + expense_growth + avg_savings_last_3m,
  data = train_data
)

lm_predictions <- predict(lm_model, test_data)
lm_rmse <- sqrt(mean((lm_predictions - actual)^2))
lm_mae <- mean(abs(lm_predictions - actual))

cat(sprintf("  LM RMSE: $%.2f\n", lm_rmse))
cat(sprintf("  LM MAE:  $%.2f\n", lm_mae))
cat(sprintf("\nRF improves over LM by %.1f%% RMSE\n", (1 - rmse/lm_rmse) * 100))

# Save model
models_dir <- file.path(dirname(getwd()), "backend-r", "models")
dir.create(models_dir, showWarnings = FALSE, recursive = TRUE)

saveRDS(rf_model, file.path(models_dir, "rf_savings_model.rds"))

cat("\nModel saved to models/rf_savings_model.rds\n")
cat("\n=== Training Complete ===\n")
