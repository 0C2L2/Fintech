# ============================================
# Expenses CRUD Module
# ============================================

#' List expenses with optional filters
#' @get /api/expenses
#' @serializer unboxedJSON
function(req, res) {
  user_id <- req$USER_ID
  
  # Parse query params
  month <- req$argsQuery$month
  category <- req$argsQuery$category
  page <- as.integer(req$argsQuery$page %||% 1)
  limit <- as.integer(req$argsQuery$limit %||% 50)
  
  if (is.na(page) || page < 1) page <- 1
  if (is.na(limit) || limit < 1) limit <- 50
  if (limit > 200) limit <- 200
  offset <- (page - 1) * limit
  
  # Build query
  where_clauses <- c("e.user_id = ?")
  params <- list(user_id)
  
  if (!is.null(month) && nchar(month) > 0) {
    parsed_month <- parse_month(month)
    if (!is.null(parsed_month)) {
      where_clauses <- c(where_clauses, "e.expense_month = ?")
      params <- c(params, list(parsed_month))
    }
  }
  
  if (!is.null(category) && nchar(category) > 0) {
    where_clauses <- c(where_clauses, "e.category_id = ?")
    params <- c(params, list(category))
  }
  
  where_sql <- paste(where_clauses, collapse = " AND ")
  
  # Count total
  count_sql <- sprintf("SELECT COUNT(*) as total FROM expenses e WHERE %s", where_sql)
  total <- db_query(count_sql, params = params)$total[1]
  
  # Get expenses with category name
  query_sql <- sprintf(
    "SELECT e.id, e.category_id, c.name as category_name, e.amount, e.expense_type, e.expense_month, e.note, e.created_at, e.updated_at 
     FROM expenses e 
     LEFT JOIN categories c ON e.category_id = c.id 
     WHERE %s 
     ORDER BY e.expense_month DESC, e.created_at DESC 
     LIMIT ? OFFSET ?",
    where_sql
  )
  params <- c(params, list(limit, offset))
  
  expenses <- db_query(query_sql, params = params)
  
  return(success_response(data = list(
    expenses = df_to_list(expenses),
    total = total,
    page = page,
    limit = limit,
    total_pages = ceiling(total / limit)
  )))
}

#' Create a new expense
#' @post /api/expenses
#' @serializer unboxedJSON
function(req, res) {
  user_id <- req$USER_ID
  body <- parse_body(req)
  
  # Validate required fields
  validation <- validate_required(body, c("category_id", "amount", "expense_month"))
  if (!is.null(validation)) {
    return(error_response(res, validation, 400))
  }
  
  # Validate amount
  amount <- as.numeric(body$amount)
  if (is.na(amount) || amount < 0) {
    return(error_response(res, "Amount must be a non-negative number", 400))
  }
  
  # Validate category belongs to user
  cat_check <- db_get_one(
    "SELECT id FROM categories WHERE id = ? AND user_id = ?",
    params = list(body$category_id, user_id)
  )
  if (is.null(cat_check)) {
    return(error_response(res, "Category not found", 404))
  }
  
  # Parse month
  expense_month <- parse_month(body$expense_month)
  if (is.null(expense_month)) {
    return(error_response(res, "Invalid month format. Use YYYY-MM or YYYY-MM-DD", 400))
  }
  
  expense_type <- body$expense_type %||% "expense"
  note <- body$note %||% ""
  
  expense_id <- new_uuid()
  db_execute(
    "INSERT INTO expenses (id, user_id, category_id, amount, expense_type, expense_month, note, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
    params = list(expense_id, user_id, body$category_id, amount, expense_type, expense_month, note)
  )
  
  # Return the created expense with category name
  expense <- db_get_one(
    "SELECT e.id, e.category_id, c.name as category_name, e.amount, e.expense_type, e.expense_month, e.note, e.created_at 
     FROM expenses e 
     LEFT JOIN categories c ON e.category_id = c.id 
     WHERE e.id = ?",
    params = list(expense_id)
  )
  
  res$status <- 201
  return(success_response(data = expense, message = "Expense created successfully"))
}

#' Update an expense
#' @put /api/expenses/<id>
#' @serializer unboxedJSON
function(req, res, id) {
  user_id <- req$USER_ID
  body <- parse_body(req)
  
  # Check expense exists and belongs to user
  existing <- db_get_one(
    "SELECT id FROM expenses WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  if (is.null(existing)) {
    return(error_response(res, "Expense not found", 404))
  }
  
  updates <- c()
  params <- list()
  
  if (!is.null(body$category_id)) {
    cat_check <- db_get_one(
      "SELECT id FROM categories WHERE id = ? AND user_id = ?",
      params = list(body$category_id, user_id)
    )
    if (is.null(cat_check)) {
      return(error_response(res, "Category not found", 404))
    }
    updates <- c(updates, "category_id = ?")
    params <- c(params, list(body$category_id))
  }
  
  if (!is.null(body$amount)) {
    amount <- as.numeric(body$amount)
    if (is.na(amount) || amount < 0) {
      return(error_response(res, "Amount must be a non-negative number", 400))
    }
    updates <- c(updates, "amount = ?")
    params <- c(params, list(amount))
  }
  
  if (!is.null(body$expense_type)) {
    updates <- c(updates, "expense_type = ?")
    params <- c(params, list(body$expense_type))
  }
  
  if (!is.null(body$expense_month)) {
    expense_month <- parse_month(body$expense_month)
    if (is.null(expense_month)) {
      return(error_response(res, "Invalid month format", 400))
    }
    updates <- c(updates, "expense_month = ?")
    params <- c(params, list(expense_month))
  }
  
  if (!is.null(body$note)) {
    updates <- c(updates, "note = ?")
    params <- c(params, list(body$note))
  }
  
  if (length(updates) == 0) {
    return(error_response(res, "No valid fields to update", 400))
  }
  
  updates <- c(updates, "updated_at = datetime('now')")
  params <- c(params, list(id))
  
  sql <- sprintf("UPDATE expenses SET %s WHERE id = ?", paste(updates, collapse = ", "))
  db_execute(sql, params = params)
  
  # Return updated expense
  expense <- db_get_one(
    "SELECT e.id, e.category_id, c.name as category_name, e.amount, e.expense_type, e.expense_month, e.note, e.created_at, e.updated_at 
     FROM expenses e 
     LEFT JOIN categories c ON e.category_id = c.id 
     WHERE e.id = ?",
    params = list(id)
  )
  
  return(success_response(data = expense, message = "Expense updated successfully"))
}

#' Delete an expense
#' @delete /api/expenses/<id>
#' @serializer unboxedJSON
function(req, res, id) {
  user_id <- req$USER_ID
  
  # Check expense exists and belongs to user
  existing <- db_get_one(
    "SELECT id FROM expenses WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  if (is.null(existing)) {
    return(error_response(res, "Expense not found", 404))
  }
  
  db_execute(
    "DELETE FROM expenses WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  
  return(success_response(message = "Expense deleted successfully"))
}

#' Upsert monthly summary (income/savings)
#' @post /api/monthly-summary
#' @serializer unboxedJSON
function(req, res) {
  user_id <- req$USER_ID
  body <- parse_body(req)
  
  validation <- validate_required(body, c("month"))
  if (!is.null(validation)) {
    return(error_response(res, validation, 400))
  }
  
  month <- parse_month(body$month)
  if (is.null(month)) {
    return(error_response(res, "Invalid month format", 400))
  }
  
  income <- as.numeric(body$income %||% 0)
  total_savings <- as.numeric(body$total_savings %||% 0)
  
  # Check if exists
  existing <- db_get_one(
    "SELECT id FROM monthly_snapshots WHERE user_id = ? AND month = ?",
    params = list(user_id, month)
  )
  
  p_income <- as.numeric(unname(income))[1]
  p_total_savings <- as.numeric(unname(total_savings))[1]
  p_month <- as.character(unname(month))[1]
  p_user_id <- as.character(unname(user_id))[1]

  if (!is.null(existing)) {
    # Update
    p_existing_id <- as.character(unname(existing$id))[1]
    db_execute(
      "UPDATE monthly_snapshots SET income = ?, total_savings = ?, updated_at = datetime('now') WHERE id = ?",
      params = list(p_income, p_total_savings, p_existing_id)
    )
  } else {
    # Insert
    snap_id <- new_uuid()
    db_execute(
      "INSERT INTO monthly_snapshots (id, user_id, month, income, total_savings, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      params = list(snap_id, p_user_id, p_month, p_income, p_total_savings)
    )
  }
  
  # Calculate total expenses for this month
  total_exp <- db_query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_month = ?",
    params = list(user_id, month)
  )$total[1]
  
  p_total_exp <- as.numeric(unname(total_exp))[1]
  db_execute(
    "UPDATE monthly_snapshots SET total_expense = ? WHERE user_id = ? AND month = ?",
    params = list(p_total_exp, p_user_id, p_month)
  )
  
  snapshot <- db_get_one(
    "SELECT * FROM monthly_snapshots WHERE user_id = ? AND month = ?",
    params = list(user_id, month)
  )
  
  return(success_response(data = snapshot, message = "Monthly summary updated"))
}

#' Get monthly summary
#' @get /api/monthly-summary/<month>
#' @serializer unboxedJSON
function(req, res, month) {
  user_id <- req$USER_ID
  
  parsed_month <- parse_month(month)
  if (is.null(parsed_month)) {
    return(error_response(res, "Invalid month format", 400))
  }
  
  snapshot <- db_get_one(
    "SELECT * FROM monthly_snapshots WHERE user_id = ? AND month = ?",
    params = list(user_id, parsed_month)
  )
  
  if (is.null(snapshot)) {
    # Calculate from expenses
    total_exp <- db_query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_month = ?",
      params = list(user_id, parsed_month)
    )$total[1]
    
    snapshot <- list(
      month = parsed_month,
      income = 0,
      total_expense = total_exp,
      total_savings = 0
    )
  }
  
  return(success_response(data = snapshot))
}

# Null-coalescing operator
`%||%` <- function(a, b) if (is.null(a)) b else a
