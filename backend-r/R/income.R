# ============================================
# Income CRUD Module
# ============================================

#' List income transactions with optional filters
#' @get /api/income
#' @serializer unboxedJSON
function(req, res) {
  user_id <- req$USER_ID
  
  # Parse query params
  month <- req$argsQuery$month
  page <- as.integer(req$argsQuery$page %||% 1)
  limit <- as.integer(req$argsQuery$limit %||% 50)
  
  if (is.na(page) || page < 1) page <- 1
  if (is.na(limit) || limit < 1) limit <- 50
  if (limit > 200) limit <- 200
  offset <- (page - 1) * limit
  
  # Build query
  where_clauses <- c("user_id = ?")
  params <- list(user_id)
  
  if (!is.null(month) && nchar(month) > 0) {
    parsed_month <- parse_month(month)
    if (!is.null(parsed_month)) {
      where_clauses <- c(where_clauses, "income_month = ?")
      params <- c(params, list(parsed_month))
    }
  }
  
  where_sql <- paste(where_clauses, collapse = " AND ")
  
  # Count total
  count_sql <- sprintf("SELECT COUNT(*) as total FROM income WHERE %s", where_sql)
  total <- db_query(count_sql, params = params)$total[1]
  
  # Get income records
  query_sql <- sprintf(
    "SELECT id, amount, income_month, source, note, created_at, updated_at 
     FROM income 
     WHERE %s 
     ORDER BY income_month DESC, created_at DESC 
     LIMIT ? OFFSET ?",
    where_sql
  )
  params <- c(params, list(limit, offset))
  
  income_records <- db_query(query_sql, params = params)
  
  return(success_response(data = list(
    income = df_to_list(income_records),
    total = total,
    page = page,
    limit = limit,
    total_pages = ceiling(max(total, 1) / limit)
  )))
}

#' Create a new income transaction
#' @post /api/income
#' @serializer unboxedJSON
function(req, res) {
  user_id <- req$USER_ID
  body <- parse_body(req)
  
  # Validate required fields
  validation <- validate_required(body, c("amount", "income_month", "source"))
  if (!is.null(validation)) {
    return(error_response(res, validation, 400))
  }
  
  # Validate amount
  amount <- as.numeric(body$amount)
  if (is.na(amount) || amount < 0) {
    return(error_response(res, "Amount must be a non-negative number", 400))
  }
  
  # Parse month
  income_month <- parse_month(body$income_month)
  if (is.null(income_month)) {
    return(error_response(res, "Invalid month format. Use YYYY-MM or YYYY-MM-DD", 400))
  }
  
  source_txt <- body$source %||% "General Income"
  note <- body$note %||% ""
  
  income_id <- new_uuid()
  db_execute(
    "INSERT INTO income (id, user_id, amount, income_month, source, note, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
    params = list(income_id, user_id, amount, income_month, source_txt, note)
  )
  
  # Sync income to monthly summary
  sync_monthly_income(user_id, income_month)
  
  # Return the created income
  income_record <- db_get_one(
    "SELECT id, amount, income_month, source, note, created_at FROM income WHERE id = ?",
    params = list(income_id)
  )
  
  res$status <- 201
  return(success_response(data = income_record, message = "Income record created successfully"))
}

#' Update an income transaction
#' @put /api/income/<id>
#' @serializer unboxedJSON
function(req, res, id) {
  user_id <- req$USER_ID
  body <- parse_body(req)
  
  # Check record exists and belongs to user
  existing <- db_get_one(
    "SELECT id, income_month FROM income WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  if (is.null(existing)) {
    return(error_response(res, "Income record not found", 404))
  }
  
  updates <- c()
  params <- list()
  
  if (!is.null(body$amount)) {
    amt <- as.numeric(body$amount)
    if (is.na(amt) || amt < 0) return(error_response(res, "Invalid amount", 400))
    updates <- c(updates, "amount = ?"); params <- c(params, list(amt))
  }
  
  if (!is.null(body$source)) {
    updates <- c(updates, "source = ?"); params <- c(params, list(body$source))
  }
  
  if (!is.null(body$income_month)) {
    im <- parse_month(body$income_month)
    if (is.null(im)) return(error_response(res, "Invalid month", 400))
    updates <- c(updates, "income_month = ?"); params <- c(params, list(im))
  }
  
  if (!is.null(body$note)) {
    updates <- c(updates, "note = ?"); params <- c(params, list(body$note))
  }
  
  if (length(updates) == 0) {
    return(error_response(res, "No valid fields to update", 400))
  }
  
  updates <- c(updates, "updated_at = datetime('now')")
  params <- c(params, list(id))
  
  sql <- sprintf("UPDATE income SET %s WHERE id = ?", paste(updates, collapse = ", "))
  db_execute(sql, params = params)
  
  # Resync income (both old month and new month just in case it changed)
  sync_monthly_income(user_id, existing$income_month)
  if (!is.null(body$income_month)) {
    sync_monthly_income(user_id, body$income_month)
  }
  
  # Return updated record
  updated <- db_get_one(
    "SELECT id, amount, income_month, source, note, created_at, updated_at FROM income WHERE id = ?",
    params = list(id)
  )
  
  return(success_response(data = updated, message = "Income record updated successfully"))
}

#' Delete an income transaction
#' @delete /api/income/<id>
#' @serializer unboxedJSON
function(req, res, id) {
  user_id <- req$USER_ID
  
  # Check record exists and belongs to user
  existing <- db_get_one(
    "SELECT id, income_month FROM income WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  if (is.null(existing)) {
    return(error_response(res, "Income record not found", 404))
  }
  
  db_execute(
    "DELETE FROM income WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  
  # Resync income
  sync_monthly_income(user_id, existing$income_month)
  
  return(success_response(message = "Income record deleted successfully"))
}

#' Helper: Sync total income to monthly snapshots
sync_monthly_income <- function(user_id, month) {
  parsed_month <- parse_month(month)
  if (is.null(parsed_month)) return()
  
  # Calculate sum of income for this user/month
  total_inc_res <- db_query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? AND income_month = ?",
    params = list(user_id, parsed_month)
  )
  total_inc <- total_inc_res$total[1]
  
  # Typecast for safety
  p_total_inc <- as.numeric(unname(total_inc))[1]
  p_user_id <- as.character(unname(user_id))[1]
  p_month <- as.character(unname(parsed_month))[1]
  
  # Check if snapshot exists
  existing <- db_get_one(
    "SELECT id FROM monthly_snapshots WHERE user_id = ? AND month = ?",
    params = list(user_id, parsed_month)
  )
  
  if (!is.null(existing)) {
    p_existing_id <- as.character(unname(existing$id))[1]
    db_execute(
      "UPDATE monthly_snapshots SET income = ?, updated_at = datetime('now') WHERE id = ?",
      params = list(p_total_inc, p_existing_id)
    )
  } else {
    # If no snapshot, create one with default savings goals
    snap_id <- new_uuid()
    db_execute(
      "INSERT INTO monthly_snapshots (id, user_id, month, income, total_expense, total_savings, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 0, 0, datetime('now'), datetime('now'))",
      params = list(snap_id, p_user_id, p_month, p_total_inc)
    )
  }
}
