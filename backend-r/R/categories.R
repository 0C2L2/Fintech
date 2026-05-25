# ============================================
# Categories CRUD Module
# ============================================

#' List all categories for the current user
#' @get /api/categories
#' @serializer unboxedJSON
function(req, res) {
  user_id <- req$USER_ID
  
  categories <- db_query(
    "SELECT id, name, is_default, created_at, updated_at FROM categories WHERE user_id = ? ORDER BY is_default DESC, name ASC",
    params = list(user_id)
  )
  
  return(success_response(data = df_to_list(categories)))
}

#' Create a new category
#' @post /api/categories
#' @serializer unboxedJSON
function(req, res) {
  user_id <- req$USER_ID
  body <- parse_body(req)
  
  # Validate
  validation <- validate_required(body, c("name"))
  if (!is.null(validation)) {
    return(error_response(res, validation, 400))
  }
  
  # Check for duplicate name for this user
  existing <- db_get_one(
    "SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?)",
    params = list(user_id, trimws(body$name))
  )
  if (!is.null(existing)) {
    return(error_response(res, "Category with this name already exists", 409))
  }
  
  cat_id <- new_uuid()
  db_execute(
    "INSERT INTO categories (id, user_id, name, is_default, created_at, updated_at) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))",
    params = list(cat_id, user_id, trimws(body$name))
  )
  
  category <- db_get_one(
    "SELECT id, name, is_default, created_at, updated_at FROM categories WHERE id = ?",
    params = list(cat_id)
  )
  
  res$status <- 201
  return(success_response(data = category, message = "Category created successfully"))
}

#' Update a category
#' @put /api/categories/<id>
#' @serializer unboxedJSON
function(req, res, id) {
  user_id <- req$USER_ID
  body <- parse_body(req)
  
  # Check category exists and belongs to user
  category <- db_get_one(
    "SELECT id, name, is_default FROM categories WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  
  if (is.null(category)) {
    return(error_response(res, "Category not found", 404))
  }
  
  # Don't allow renaming "Other" category
  if (category$name == "Other") {
    return(error_response(res, "Cannot rename the 'Other' category", 400))
  }
  
  # Validate name
  validation <- validate_required(body, c("name"))
  if (!is.null(validation)) {
    return(error_response(res, validation, 400))
  }
  
  # Check for duplicate
  existing <- db_get_one(
    "SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?",
    params = list(user_id, trimws(body$name), id)
  )
  if (!is.null(existing)) {
    return(error_response(res, "Category with this name already exists", 409))
  }
  
  db_execute(
    "UPDATE categories SET name = ?, updated_at = datetime('now') WHERE id = ?",
    params = list(trimws(body$name), id)
  )
  
  updated <- db_get_one(
    "SELECT id, name, is_default, created_at, updated_at FROM categories WHERE id = ?",
    params = list(id)
  )
  
  return(success_response(data = updated, message = "Category updated successfully"))
}

#' Delete a category (moves expenses to "Other")
#' @delete /api/categories/<id>
#' @serializer unboxedJSON
function(req, res, id) {
  user_id <- req$USER_ID
  
  # Check category exists and belongs to user
  category <- db_get_one(
    "SELECT id, name FROM categories WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  
  if (is.null(category)) {
    return(error_response(res, "Category not found", 404))
  }
  
  # Don't allow deleting "Other" category
  if (category$name == "Other") {
    return(error_response(res, "Cannot delete the 'Other' category", 400))
  }
  
  # Find "Other" category for this user
  other_cat <- db_get_one(
    "SELECT id FROM categories WHERE user_id = ? AND name = 'Other'",
    params = list(user_id)
  )
  
  if (!is.null(other_cat)) {
    # Move expenses to "Other"
    db_execute(
      "UPDATE expenses SET category_id = ?, updated_at = datetime('now') WHERE category_id = ? AND user_id = ?",
      params = list(other_cat$id, id, user_id)
    )
  }
  
  # Delete the category
  db_execute(
    "DELETE FROM categories WHERE id = ? AND user_id = ?",
    params = list(id, user_id)
  )
  
  return(success_response(message = "Category deleted successfully"))
}
