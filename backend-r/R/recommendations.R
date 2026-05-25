# ============================================
# Recommendation Engine Module
# ============================================

#' Generate personalized financial recommendations
#' @param features Named list from build_feature_vector()
#' @param flags List of overspending flags from detect_overspending()
#' @param cluster_label Character: cluster assignment
#' @param predicted_savings Numeric: predicted next-month savings
#' @return List of recommendation objects
generate_recommendations <- function(features, flags, cluster_label, predicted_savings) {
  recommendations <- list()
  
  # --- Flag-based recommendations ---
  for (flag in flags) {
    rec <- NULL
    
    if (flag$issue == "High entertainment spending") {
      rec <- list(
        title = "Reduce entertainment spending",
        issue = flag$issue,
        severity = flag$severity,
        action = "Cut entertainment spending by 10-15% this month",
        impact = sprintf(
          "Could improve monthly savings by $%.0f-$%.0f",
          features$entertainment * 0.10, features$entertainment * 0.15
        )
      )
    }
    
    if (flag$issue == "High rent burden") {
      rec <- list(
        title = "Address high housing costs",
        issue = flag$issue,
        severity = flag$severity,
        action = "Consider shared housing or reduce other fixed costs to compensate",
        impact = "Protecting essentials while cutting flexible spending can free up budget"
      )
    }
    
    if (flag$issue == "Low savings rate") {
      rec <- list(
        title = "Boost your savings rate",
        issue = flag$issue,
        severity = flag$severity,
        action = "Set up automatic savings of at least 10% of income",
        impact = sprintf(
          "Saving 10%% of income would mean $%.0f/month in savings",
          features$income * 0.10
        )
      )
    }
    
    if (flag$issue == "High food spending") {
      rec <- list(
        title = "Control food spending",
        issue = flag$issue,
        severity = flag$severity,
        action = "Set a weekly food budget and plan meals ahead",
        impact = sprintf(
          "Reducing food spend by 8-10%% could save $%.0f-$%.0f/month",
          features$food * 0.08, features$food * 0.10
        )
      )
    }
    
    if (flag$issue == "Spending exceeds income") {
      rec <- list(
        title = "Urgent: Spending exceeds income",
        issue = flag$issue,
        severity = "critical",
        action = "Immediately cap all discretionary spending and review subscriptions",
        impact = sprintf(
          "You need to reduce spending by at least $%.0f to break even",
          features$total_expense - features$income
        )
      )
    }
    
    if (flag$issue == "Rapid expense growth") {
      rec <- list(
        title = "Slow expense growth",
        issue = flag$issue,
        severity = flag$severity,
        action = "Review recent expense increases and identify one-time vs recurring items",
        impact = "Controlling expense growth early prevents financial stress"
      )
    }
    
    if (flag$issue == "High transport costs") {
      rec <- list(
        title = "Optimize transport expenses",
        issue = flag$issue,
        severity = flag$severity,
        action = "Consider public transit, carpooling, or consolidating trips",
        impact = sprintf(
          "Reducing transport by 15%% could save $%.0f/month",
          features$transport * 0.15
        )
      )
    }
    
    if (flag$issue == "High discretionary spending") {
      rec <- list(
        title = "Limit discretionary spending",
        issue = flag$issue,
        severity = flag$severity,
        action = "Set a strict monthly budget for non-essential categories",
        impact = sprintf(
          "Moving 10%% of discretionary to savings adds $%.0f/month",
          features$discretionary_spending * 0.10
        )
      )
    }
    
    if (!is.null(rec)) {
      recommendations <- c(recommendations, list(rec))
    }
  }
  
  # --- Segment-based recommendations ---
  if (cluster_label == "Entertainment-Heavy Spender" && 
      !any(sapply(recommendations, function(r) grepl("entertainment", tolower(r$title))))) {
    recommendations <- c(recommendations, list(list(
      title = "Entertainment spending pattern detected",
      issue = "Your spending profile shows heavy entertainment allocation",
      severity = "medium",
      action = "Set a fixed monthly entertainment budget and stick to it",
      impact = "Building discipline in entertainment spending improves overall financial health"
    )))
  }
  
  if (cluster_label == "High Saver") {
    recommendations <- c(recommendations, list(list(
      title = "Great savings habit!",
      issue = "Positive: You are a strong saver",
      severity = "info",
      action = "Consider investing a portion of savings for long-term growth",
      impact = "Even modest investments can compound significantly over time"
    )))
  }
  
  # --- Prediction-based recommendations ---
  if (predicted_savings < 0) {
    recommendations <- c(recommendations, list(list(
      title = "Predicted negative savings ahead",
      issue = sprintf("Predicted savings for next month: -$%.0f", abs(predicted_savings)),
      severity = "critical",
      action = "Impose strict caps on discretionary expenses immediately",
      impact = "Preventing negative savings avoids debt accumulation"
    )))
  }
  
  # --- General tips if few recommendations ---
  if (length(recommendations) == 0) {
    recommendations <- c(recommendations, list(list(
      title = "You're doing well!",
      issue = "No major financial issues detected",
      severity = "info",
      action = "Continue your current spending habits and consider increasing savings",
      impact = "Consistency is key to long-term financial health"
    )))
  }
  
  return(recommendations)
}
