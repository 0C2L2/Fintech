# ============================================
# Excel Report Generation Module
# ============================================

library(openxlsx)

#' Generate Excel financial report for a user and month
#' @param user_id User's UUID
#' @param month Target month (YYYY-MM-DD)
#' @return Path to generated Excel file
generate_excel_report <- function(user_id, month) {
  # Build features and analysis
  features <- build_feature_vector(user_id, month)
  cluster_label <- assign_cluster(features)
  predicted <- predict_savings(features, user_id)
  flags <- detect_overspending(features)
  score <- calculate_financial_score(features, flags)
  recommendations <- generate_recommendations(features, flags, cluster_label, predicted)
  
  # Create workbook
  wb <- createWorkbook()
  
  # --- Styles ---
  header_style <- createStyle(
    fontSize = 12, fontColour = "#FFFFFF", fgFill = "#1a56db",
    halign = "center", textDecoration = "bold",
    border = "TopBottomLeftRight", borderColour = "#1a56db"
  )
  
  number_style <- createStyle(numFmt = "#,##0.00")
  percent_style <- createStyle(numFmt = "0.0%")
  
  title_style <- createStyle(
    fontSize = 16, textDecoration = "bold", fontColour = "#1a56db"
  )
  
  # ==========================================
  # Sheet 1: Summary
  # ==========================================
  addWorksheet(wb, "Summary")
  
  summary_data <- data.frame(
    Metric = c("Month", "Income", "Total Expenses", "Total Savings", 
               "Savings Rate", "Predicted Next Savings", "Financial Segment",
               "Financial Score"),
    Value = c(
      month,
      sprintf("$%.2f", features$income),
      sprintf("$%.2f", features$total_expense),
      sprintf("$%.2f", features$total_savings),
      sprintf("%.1f%%", features$savings_rate * 100),
      sprintf("$%.2f", predicted),
      cluster_label,
      sprintf("%d/100", score)
    )
  )
  
  writeData(wb, "Summary", "Financial Summary Report", startRow = 1)
  addStyle(wb, "Summary", title_style, rows = 1, cols = 1)
  writeData(wb, "Summary", summary_data, startRow = 3, headerStyle = header_style)
  setColWidths(wb, "Summary", cols = 1:2, widths = c(25, 25))
  
  # ==========================================
  # Sheet 2: Category Breakdown
  # ==========================================
  addWorksheet(wb, "Category Breakdown")
  
  cat_data <- db_query(
    "SELECT c.name as Category, COALESCE(SUM(e.amount), 0) as Amount
     FROM expenses e 
     JOIN categories c ON e.category_id = c.id
     WHERE e.user_id = ? AND e.expense_month = ?
     GROUP BY c.name
     ORDER BY Amount DESC",
    params = list(user_id, month)
  )
  
  if (nrow(cat_data) > 0) {
    total <- sum(cat_data$Amount)
    cat_data$`Share %` <- if (total > 0) round(cat_data$Amount / total * 100, 1) else 0
  } else {
    cat_data <- data.frame(Category = "No data", Amount = 0, `Share %` = 0)
  }
  
  writeData(wb, "Category Breakdown", "Spending by Category", startRow = 1)
  addStyle(wb, "Category Breakdown", title_style, rows = 1, cols = 1)
  writeData(wb, "Category Breakdown", cat_data, startRow = 3, headerStyle = header_style)
  setColWidths(wb, "Category Breakdown", cols = 1:3, widths = c(20, 15, 12))
  
  # ==========================================
  # Sheet 3: Monthly History
  # ==========================================
  addWorksheet(wb, "Monthly History")
  
  history <- db_query(
    "SELECT month as Month, income as Income, total_expense as Expenses, 
            total_savings as Savings
     FROM monthly_snapshots WHERE user_id = ?
     ORDER BY month DESC LIMIT 12",
    params = list(user_id)
  )
  
  if (nrow(history) == 0) {
    history <- data.frame(Month = month, Income = features$income, 
                          Expenses = features$total_expense, Savings = features$total_savings)
  }
  
  writeData(wb, "Monthly History", "Monthly Financial History", startRow = 1)
  addStyle(wb, "Monthly History", title_style, rows = 1, cols = 1)
  writeData(wb, "Monthly History", history, startRow = 3, headerStyle = header_style)
  setColWidths(wb, "Monthly History", cols = 1:4, widths = c(15, 15, 15, 15))
  
  # ==========================================
  # Sheet 4: Alerts
  # ==========================================
  addWorksheet(wb, "Alerts")
  
  if (length(flags) > 0) {
    alerts_data <- do.call(rbind, lapply(flags, function(f) {
      data.frame(
        Issue = f$issue,
        Severity = f$severity,
        Explanation = f$explanation,
        stringsAsFactors = FALSE
      )
    }))
  } else {
    alerts_data <- data.frame(
      Issue = "No alerts",
      Severity = "info",
      Explanation = "No overspending issues detected"
    )
  }
  
  writeData(wb, "Alerts", "Overspending Alerts", startRow = 1)
  addStyle(wb, "Alerts", title_style, rows = 1, cols = 1)
  writeData(wb, "Alerts", alerts_data, startRow = 3, headerStyle = header_style)
  setColWidths(wb, "Alerts", cols = 1:3, widths = c(25, 12, 45))
  
  # ==========================================
  # Sheet 5: Recommendations
  # ==========================================
  addWorksheet(wb, "Recommendations")
  
  if (length(recommendations) > 0) {
    rec_data <- do.call(rbind, lapply(recommendations, function(r) {
      data.frame(
        Title = r$title,
        Action = r$action,
        Impact = r$impact,
        stringsAsFactors = FALSE
      )
    }))
  } else {
    rec_data <- data.frame(
      Title = "No recommendations",
      Action = "Keep up your current habits",
      Impact = "You're on track"
    )
  }
  
  writeData(wb, "Recommendations", "Financial Recommendations", startRow = 1)
  addStyle(wb, "Recommendations", title_style, rows = 1, cols = 1)
  writeData(wb, "Recommendations", rec_data, startRow = 3, headerStyle = header_style)
  setColWidths(wb, "Recommendations", cols = 1:3, widths = c(30, 40, 40))
  
  # Save workbook
  output_dir <- file.path(dirname(getwd()), "backend-r", "outputs")
  dir.create(output_dir, showWarnings = FALSE, recursive = TRUE)
  
  filename <- sprintf("financial_report_%s_%s.xlsx", 
                       gsub("-", "", substr(month, 1, 7)),
                       format(Sys.time(), "%Y%m%d%H%M%S"))
  filepath <- file.path(output_dir, filename)
  
  saveWorkbook(wb, filepath, overwrite = TRUE)
  
  return(list(filename = filename, filepath = filepath))
}
