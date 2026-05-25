source("R/db.R")
source("R/utils.R")
source("R/auth.R")
source("R/features.R")
source("R/clustering.R")
source("R/prediction.R")
source("R/overspending.R")
source("R/recommendations.R")
source("R/rules.R")

library(bcrypt)
library(jsonlite)

set.seed(42)

cat("Generating 100 users with data (this might take a minute or two)...\n")
pw_hash <- hashpw("password123")

for (i in 1:100) {
  user_id <- new_uuid()
  email <- sprintf("user%03d@example.com", i)
  full_name <- sprintf("Test User %03d", i)
  
  db_execute(
    "INSERT INTO users (id, full_name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, 'user', datetime('now'), datetime('now'))",
    params = list(user_id, full_name, email, pw_hash)
  )
  
  seed_user_categories(user_id)
  cats <- db_query("SELECT id, name FROM categories WHERE user_id = ?", params = list(user_id))
  
  for (m in 0:5) {
    dt <- as.POSIXlt(Sys.Date())
    dt$mon <- dt$mon - m
    month_str <- format(as.Date(dt), "%Y-%m-01")
    
    income_amount <- runif(1, 3000, 8000)
    db_execute(
      "INSERT INTO income (id, user_id, amount, income_month, source, created_at, updated_at) VALUES (?, ?, ?, ?, 'Salary', datetime('now'), datetime('now'))",
      params = list(new_uuid(), user_id, income_amount, month_str)
    )
    
    for (j in 1:nrow(cats)) {
      base_amt <- if (cats$name[j] == "Rent") runif(1, 800, 3000) else runif(1, 50, 500)
      exp_count <- if (cats$name[j] == "Rent") 1 else sample(1:5, 1)
      for (k in 1:exp_count) {
        amt <- base_amt / exp_count + runif(1, -10, 10)
        db_execute(
          "INSERT INTO expenses (id, user_id, category_id, amount, expense_month, expense_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'expense', datetime('now'), datetime('now'))",
          params = list(new_uuid(), user_id, cats$id[j], max(0, amt), month_str)
        )
      }
    }
    
    total_exp <- db_query("SELECT SUM(amount) as t FROM expenses WHERE user_id = ? AND expense_month = ?", params = list(user_id, month_str))$t[1]
    db_execute(
      "INSERT INTO monthly_snapshots (id, user_id, month, income, total_expense, total_savings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      params = list(new_uuid(), user_id, month_str, income_amount, total_exp, income_amount - total_exp)
    )
    
    # Run analysis
    features <- build_feature_vector(user_id, month_str)
    cluster_label <- assign_cluster(features)
    predicted <- predict_savings(features, user_id)
    flags <- detect_overspending(features)
    score <- calculate_financial_score(features, flags)
    recommendations <- generate_recommendations(features, flags, cluster_label, predicted)
    
    # Handle lengths carefully for SQLite inserts
    p_cluster_label <- as.character(unname(cluster_label))[1]
    p_predicted <- as.numeric(unname(predicted))[1]
    p_flags_json <- paste(as.character(toJSON(flags, auto_unbox = TRUE)), collapse = "")
    p_recs_json <- paste(as.character(toJSON(recommendations, auto_unbox = TRUE)), collapse = "")
    p_score <- as.numeric(unname(score))[1]
    
    db_execute(
      "INSERT INTO analysis_results (id, user_id, month, cluster_label, predicted_savings, overspending_flags, recommendations, financial_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
      params = list(new_uuid(), user_id, month_str, p_cluster_label, p_predicted, p_flags_json, p_recs_json, p_score)
    )
  }
  
  if (i %% 10 == 0) cat(sprintf("Generated %d users...\n", i))
}

cat("Done seeding 100 users!\n")
