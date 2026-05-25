# ============================================
# Feature Engineering Module
# ============================================

library(dplyr)
library(tidyr)

#' Build monthly feature vector for a user
#' @param user_id User's UUID
#' @param month Target month (YYYY-MM-DD format)
#' @return Named list of features
build_feature_vector <- function(user_id, month) {
  # Get monthly snapshot
  snapshot <- db_get_one(
    "SELECT income, total_expense, total_savings FROM monthly_snapshots WHERE user_id = ? AND month = ?",
    params = list(user_id, month)
  )
  
  income <- if (!is.null(snapshot)) snapshot$income else 0
  total_savings <- if (!is.null(snapshot)) snapshot$total_savings else 0
  
  # Always calculate total expense dynamically from expenses table to maintain perfect sum sync
  exp_sum <- db_query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_month = ?",
    params = list(user_id, month)
  )
  total_expense <- exp_sum$total[1]
  
  # Get category breakdown for this month with thresholds
  category_data <- db_query(
    "SELECT c.name as category, c.threshold, COALESCE(SUM(e.amount), 0) as amount
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND e.expense_month = ?
     WHERE c.user_id = ?
     GROUP BY c.name, c.threshold",
    params = list(month, user_id)
  )
  
  # Build category shares
  get_cat_amount <- function(cat_name) {
    if (nrow(category_data) == 0) return(0)
    val <- category_data$amount[tolower(category_data$category) == tolower(cat_name)]
    if (length(val) == 0) return(0)
    return(val[1])
  }
  
  rent <- get_cat_amount("Rent")
  food <- get_cat_amount("Food")
  transport <- get_cat_amount("Transport")
  education <- get_cat_amount("Education")
  entertainment <- get_cat_amount("Entertainment")
  # Total Savings in the database is actually the user's TARGET/GOAL savings
  target_savings <- if (!is.null(snapshot)) snapshot$total_savings else 0
  
  # Actual Savings is what's left over
  actual_savings <- income - total_expense
  
  # Calculate shares (avoid division by zero)
  safe_div <- function(num, denom) {
    if (denom == 0) return(0)
    return(num / denom)
  }
  
  rent_share <- safe_div(rent, total_expense)
  food_share <- safe_div(food, total_expense)
  transport_share <- safe_div(transport, total_expense)
  education_share <- safe_div(education, total_expense)
  entertainment_share <- safe_div(entertainment, total_expense)
  
  # Essential vs discretionary spending
  essential_spending <- rent + transport + food + education
  discretionary_spending <- total_expense - essential_spending
  
  # Savings rate based on ACTUAL performance
  savings_rate <- safe_div(actual_savings, income)
  
  # Get historical data for trends
  history <- db_query(
    "SELECT month, income, total_expense, total_savings 
     FROM monthly_snapshots 
     WHERE user_id = ? AND month < ? 
     ORDER BY month DESC LIMIT 6",
    params = list(user_id, month)
  )
  
  # Expense growth rate (vs previous month)
  expense_growth <- 0
  if (nrow(history) > 0) {
    prev_expense <- history$total_expense[1]
    if (prev_expense > 0) {
      expense_growth <- (total_expense - prev_expense) / prev_expense
    }
  }
  
  # Rolling averages (last 3 months)
  avg_savings_last_3m <- 0
  rolling_expense_sd <- 0
  if (nrow(history) >= 3) {
    # Calculate historical actual savings for rolling average
    hist_actual_savings <- history$income - history$total_expense
    avg_savings_last_3m <- mean(hist_actual_savings[1:3], na.rm = TRUE)
    rolling_expense_sd <- sd(history$total_expense[1:3], na.rm = TRUE)
    if (is.na(rolling_expense_sd)) rolling_expense_sd <- 0
  } else if (nrow(history) > 0) {
    avg_savings_last_3m <- mean(history$income - history$total_expense, na.rm = TRUE)
  }
  
  features <- list(
    user_id = user_id,
    month = month,
    income = income,
    total_expense = total_expense,
    total_savings = actual_savings, # UI expects actual surplus here
    target_savings = target_savings, # Keep goal separate
    actual_savings = actual_savings,
    essential_spending = essential_spending,
    discretionary_spending = discretionary_spending,
    rent = rent,
    food = food,
    transport = transport,
    education = education,
    entertainment = entertainment,
    rent_share = round(rent_share, 4),
    food_share = round(food_share, 4),
    transport_share = round(transport_share, 4),
    education_share = round(education_share, 4),
    entertainment_share = round(entertainment_share, 4),
    savings_rate = round(savings_rate, 4),
    expense_growth = round(expense_growth, 4),
    avg_savings_last_3m = round(avg_savings_last_3m, 2),
    rolling_expense_sd = round(rolling_expense_sd, 2),
    category_breakdown = df_to_list(category_data)
  )
  
  return(features)
}

#' Get historical feature vectors for a user
#' @param user_id User's UUID
#' @param n_months Number of months to look back
#' @return Data frame of monthly features
get_history_features <- function(user_id, n_months = 12) {
  months <- db_query(
    "SELECT DISTINCT month FROM monthly_snapshots WHERE user_id = ? ORDER BY month DESC LIMIT ?",
    params = list(user_id, n_months)
  )
  
  if (nrow(months) == 0) return(NULL)
  
  features_list <- lapply(months$month, function(m) {
    f <- build_feature_vector(user_id, m)
    # Remove nested list for data frame
    f$category_breakdown <- NULL
    data.frame(f, stringsAsFactors = FALSE)
  })
  
  do.call(rbind, features_list)
}
