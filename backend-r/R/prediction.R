# ============================================
# Savings Prediction Module
# ============================================

#' Predict next month's savings
#' @param features Named list from build_feature_vector()
#' @param user_id User's UUID
#' @return Numeric: predicted savings amount
predict_savings <- function(features, user_id) {
  # Try loading saved Random Forest model
  model_path <- file.path(dirname(getwd()), "backend-r", "models", "rf_savings_model.rds")
  
  if (file.exists(model_path)) {
    tryCatch({
      library(randomForest)
      model <- readRDS(model_path)
      
      # Prepare feature data frame
      new_data <- data.frame(
        income = features$income,
        total_expense = features$total_expense,
        rent_share = features$rent_share,
        food_share = features$food_share,
        transport_share = features$transport_share,
        education_share = features$education_share,
        entertainment_share = features$entertainment_share,
        savings_rate = features$savings_rate,
        expense_growth = features$expense_growth,
        avg_savings_last_3m = features$avg_savings_last_3m
      )
      
      predicted <- predict(model, new_data)
      return(round(as.numeric(predicted), 2))
    }, error = function(e) {
      message("RF prediction error, falling back to simple: ", e$message)
      return(simple_predict_savings(features, user_id))
    })
  } else {
    return(simple_predict_savings(features, user_id))
  }
}

#' Simple savings prediction fallback (linear trend)
#' @param features Named list from build_feature_vector()
#' @param user_id User's UUID
#' @return Numeric: predicted savings amount
simple_predict_savings <- function(features, user_id) {
  # Get last 6 months of savings
  history <- db_query(
    "SELECT month, total_savings FROM monthly_snapshots 
     WHERE user_id = ? ORDER BY month DESC LIMIT 6",
    params = list(user_id)
  )
  
  if (nrow(history) < 2) {
    # Not enough history - use current savings or income-based estimate
    if (features$income > 0) {
      estimated <- features$income - features$total_expense
      return(round(max(estimated, 0), 2))
    }
    return(round(features$total_savings, 2))
  }
  
  # Simple linear regression on time
  history$t <- rev(seq_len(nrow(history)))
  model <- lm(total_savings ~ t, data = history)
  next_t <- max(history$t) + 1
  predicted <- predict(model, newdata = data.frame(t = next_t))
  
  return(round(max(as.numeric(predicted), 0), 2))
}
