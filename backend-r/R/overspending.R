# ============================================
# Overspending Detection Module
# ============================================

#' Detect overspending issues based on financial rules
#' @param features Named list from build_feature_vector()
#' @return List of overspending flags
detect_overspending <- function(features) {
  flags <- list()
  
  # Rule 1: Entertainment share
  ent_rule <- FINANCIAL_RULES$Entertainment %||% 0.20
  if (features$entertainment_share > ent_rule) {
    flags <- c(flags, list(list(
      issue = "High entertainment spending",
      severity = "medium",
      explanation = sprintf(
        "Entertainment accounts for %.0f%% of your spending (threshold: %.0f%%)",
        features$entertainment_share * 100, ent_rule * 100
      ),
      category = "Entertainment",
      value = features$entertainment_share
    )))
  }
  
  # Rule 2: Rent share
  rent_rule <- FINANCIAL_RULES$Rent %||% 0.40
  if (features$rent_share > rent_rule) {
    flags <- c(flags, list(list(
      issue = "High rent burden",
      severity = "high",
      explanation = sprintf(
        "Rent accounts for %.0f%% of your spending (threshold: %.0f%%)",
        features$rent_share * 100, rent_rule * 100
      ),
      category = "Rent",
      value = features$rent_share
    )))
  }
  
  # Rule 3: Savings rate < 10% (when income is set)
  if (features$income > 0 && features$savings_rate < 0.10) {
    flags <- c(flags, list(list(
      issue = "Low savings rate",
      severity = "high",
      explanation = sprintf(
        "Savings rate is %.1f%% (recommended: at least 10%%)",
        features$savings_rate * 100
      ),
      category = "Savings",
      value = features$savings_rate
    )))
  }
  
  # Rule 4: Food share
  food_rule <- FINANCIAL_RULES$Food %||% 0.30
  if (features$food_share > food_rule) {
    flags <- c(flags, list(list(
      issue = "High food spending",
      severity = "medium",
      explanation = sprintf(
        "Food accounts for %.0f%% of your spending (threshold: %.0f%%)",
        features$food_share * 100, food_rule * 100
      ),
      category = "Food",
      value = features$food_share
    )))
  }
  
  # Rule 5: Total expense exceeds income
  if (features$income > 0 && features$total_expense > features$income) {
    flags <- c(flags, list(list(
      issue = "Spending exceeds income",
      severity = "critical",
      explanation = sprintf(
        "Total expenses ($%.0f) exceed income ($%.0f) by $%.0f",
        features$total_expense, features$income,
        features$total_expense - features$income
      ),
      category = "Overall",
      value = features$total_expense / features$income
    )))
  }
  
  # Rule 6: Expense growth > 20% month-over-month
  grow_rule <- 0.20 # Trend rules usually remain fixed
  if (features$expense_growth > grow_rule) {
    flags <- c(flags, list(list(
      issue = "Rapid expense growth",
      severity = "medium",
      explanation = sprintf(
        "Expenses grew %.0f%% compared to last month (threshold: %.0f%%)",
        features$expense_growth * 100, grow_rule * 100
      ),
      category = "Trend",
      value = features$expense_growth
    )))
  }
  
  # Rule 7: Transport share
  trans_rule <- FINANCIAL_RULES$Transport %||% 0.25
  if (features$transport_share > trans_rule) {
    flags <- c(flags, list(list(
      issue = "High transport costs",
      severity = "low",
      explanation = sprintf(
        "Transport accounts for %.0f%% of your spending (threshold: %.0f%%)",
        features$transport_share * 100, trans_rule * 100
      ),
      category = "Transport",
      value = features$transport_share
    )))
  }
  
  # Rule 8: Discretionary spending share
  disc_rule <- FINANCIAL_RULES$Discretionary %||% 0.40
  if (features$total_expense > 0) {
    disc_share <- features$discretionary_spending / features$total_expense
    if (disc_share > disc_rule) {
      flags <- c(flags, list(list(
        issue = "High discretionary spending",
        severity = "medium",
        explanation = sprintf(
          "Discretionary spending is %.0f%% of total (threshold: %.0f%%)",
          disc_share * 100, disc_rule * 100
        ),
        category = "Discretionary",
        value = disc_share
      )))
    }
  }
  
  # Rule 9: Custom Budget Thresholds
  if (!is.null(features$category_breakdown) && length(features$category_breakdown) > 0) {
    for (cat in features$category_breakdown) {
      # Only alert if threshold is set (> 0) and exceeded
      if (!is.null(cat$threshold) && cat$threshold > 0 && cat$amount > cat$threshold) {
        flags <- c(flags, list(list(
          issue = sprintf("Budget exceeded: %s", cat$category),
          severity = "high",
          explanation = sprintf(
            "You spent $%.2f on %s, exceeding your set budget of $%.0f",
            cat$amount, cat$category, cat$threshold
          ),
          category = cat$category,
          value = cat$amount / cat$threshold
        )))
      }
    }
  }
  
  return(flags)
}

#' Calculate a financial health score (0-100)
#' @param features Named list from build_feature_vector()
#' @param flags List of overspending flags
#' @return Numeric: score from 0 to 100
calculate_financial_score <- function(features, flags) {
  score <- 100
  
  # Deduct points per flag by severity
  for (flag in flags) {
    if (flag$severity == "critical") score <- score - 25
    else if (flag$severity == "high") score <- score - 15
    else if (flag$severity == "medium") score <- score - 10
    else if (flag$severity == "low") score <- score - 5
  }
  
  # Bonus points for good savings rate
  if (features$savings_rate > 0.20) score <- score + 10
  if (features$savings_rate > 0.30) score <- score + 5
  
  # Ensure bounds
  score <- max(0, min(100, score))
  
  return(round(score))
}
