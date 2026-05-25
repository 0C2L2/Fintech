# ============================================
# Admin Module
# ============================================

#' Check if user is admin middleware helper
check_admin <- function(req, res) {
  if (is.null(req$USER_ROLE) || req$USER_ROLE != "admin") {
    return(FALSE)
  }
  return(TRUE)
}

#' Admin overview statistics
#' @get /api/admin/overview
#' @serializer unboxedJSON
function(req, res) {
  if (!check_admin(req, res)) {
    return(error_response(res, "Admin access required", 403))
  }

  total_users <- db_query("SELECT COUNT(*) as count FROM users WHERE role = 'user'")$count[1]
  total_expenses <- db_query("SELECT COUNT(*) as count FROM expenses")$count[1]
  total_expense_amount <- db_query("SELECT COALESCE(SUM(amount), 0) as total FROM expenses")$total[1]
  total_reports <- db_query("SELECT COUNT(*) as count FROM reports")$count[1]

  # Latest month activity
  latest_month <- db_query(
    "SELECT expense_month, COUNT(*) as count, SUM(amount) as total
     FROM expenses
     GROUP BY expense_month
     ORDER BY expense_month DESC LIMIT 1"
  )

  return(success_response(data = list(
    total_users = total_users,
    total_expenses = total_expenses,
    total_expense_amount = round(total_expense_amount, 2),
    total_reports = total_reports,
    latest_activity = if (nrow(latest_month) > 0) as.list(latest_month[1, ]) else NULL
  )))
}

#' Admin segment distribution
#' @get /api/admin/segments
#' @serializer unboxedJSON
function(req, res) {
  if (!check_admin(req, res)) {
    return(error_response(res, "Admin access required", 403))
  }

  segments <- db_query(
    "SELECT cluster_label as segment, COUNT(*) as count
     FROM analysis_results
     WHERE cluster_label IS NOT NULL
     GROUP BY cluster_label
     ORDER BY count DESC"
  )

  return(success_response(data = df_to_list(segments)))
}

#' Admin overspending summary
#' @get /api/admin/overspending
#' @serializer unboxedJSON
function(req, res) {
  if (!check_admin(req, res)) {
    return(error_response(res, "Admin access required", 403))
  }

  # Get all recent analysis results and aggregate overspending flags
  results <- db_query(
    "SELECT overspending_flags FROM analysis_results
     WHERE overspending_flags IS NOT NULL
     ORDER BY created_at DESC LIMIT 100"
  )

  issue_counts <- list()

  if (nrow(results) > 0) {
    for (i in 1:nrow(results)) {
      flags_json <- results$overspending_flags[i]
      if (!is.null(flags_json) && nchar(flags_json) > 2) {
        tryCatch(
          {
            flags <- fromJSON(flags_json)
            if (is.data.frame(flags) && "issue" %in% names(flags)) {
              for (issue in flags$issue) {
                if (is.null(issue_counts[[issue]])) {
                  issue_counts[[issue]] <- 0
                }
                issue_counts[[issue]] <- issue_counts[[issue]] + 1
              }
            }
          },
          error = function(e) {
            # Skip malformed JSON
          }
        )
      }
    }
  }

  # Convert to list format
  summary <- lapply(names(issue_counts), function(name) {
    list(issue = name, count = issue_counts[[name]])
  })

  # Sort by count descending
  if (length(summary) > 0) {
    counts <- sapply(summary, function(x) x$count)
    summary <- summary[order(counts, decreasing = TRUE)]
  }

  return(success_response(data = summary))
}

#' Admin: list all users
#' @get /api/admin/users
#' @serializer unboxedJSON
function(req, res) {
  if (!check_admin(req, res)) {
    return(error_response(res, "Admin access required", 403))
  }

  users <- db_query(
    "SELECT u.id, u.full_name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM expenses WHERE user_id = u.id) as expense_count,
            (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = u.id) as total_spent
     FROM users u
     ORDER BY u.created_at DESC"
  )

  return(success_response(data = df_to_list(users)))
}

#' Admin: get all database tables
#' @get /api/admin/db-tables
#' @serializer unboxedJSON
function(req, res) {
  if (!check_admin(req, res)) {
    return(error_response(res, "Admin access required", 403))
  }

  tables <- db_query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  return(success_response(data = as.character(tables$name)))
}

#' Admin: get data from a specific table
#' @get /api/admin/db-data/<table_name>
#' @serializer unboxedJSON
function(req, res, table_name) {
  if (!check_admin(req, res)) {
    return(error_response(res, "Admin access required", 403))
  }

  # Basic validation to prevent SQL injection (only allow alphanumeric and underscore)
  if (!grepl("^[A-Za-z0-9_]+$", table_name)) {
    return(error_response(res, "Invalid table name", 400))
  }

  # Verify table exists
  tables <- db_query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  if (!(table_name %in% tables$name)) {
    return(error_response(res, "Table not found", 404))
  }

  # Query data (limit 100 for safety)
  sql <- sprintf("SELECT * FROM %s LIMIT 100", table_name)
  data <- db_query(sql)

  return(success_response(data = df_to_list(data)))
}
