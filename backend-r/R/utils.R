# ============================================
# Utility Functions
# ============================================

library(jsonlite)

#' Create a success response
success_response <- function(data = NULL, message = "Success", status = 200) {
  response <- list(
    success = TRUE,
    message = message
  )
  if (!is.null(data)) {
    response$data <- data
  }
  return(response)
}

#' Create an error response
error_response <- function(res, message = "Error", status = 400, details = NULL) {
  res$status <- status
  response <- list(
    success = FALSE,
    message = message
  )
  if (!is.null(details)) {
    response$details <- details
  }
  return(response)
}

#' Validate required fields in request body
validate_required <- function(body, fields) {
  missing <- c()
  for (field in fields) {
    if (is.null(body[[field]]) || (is.character(body[[field]]) && nchar(trimws(body[[field]])) == 0)) {
      missing <- c(missing, field)
    }
  }
  if (length(missing) > 0) {
    return(paste("Missing required fields:", paste(missing, collapse = ", ")))
  }
  return(NULL)
}

#' Validate email format
validate_email <- function(email) {
  grepl("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", email)
}

#' Parse month string to consistent format (YYYY-MM-01)
parse_month <- function(month_str) {
  # Accept YYYY-MM or YYYY-MM-DD
  if (nchar(month_str) == 7) {
    month_str <- paste0(month_str, "-01")
  }
  tryCatch({
    as.Date(month_str)
    return(month_str)
  }, error = function(e) {
    return(NULL)
  })
}

#' Get current timestamp
now_timestamp <- function() {
  format(Sys.time(), "%Y-%m-%d %H:%M:%S")
}

#' Safe parse JSON body from request
parse_body <- function(req) {
  body <- req$body
  if (is.null(body)) {
    # Try to read from postBody
    raw <- req$postBody
    if (!is.null(raw) && nchar(raw) > 0) {
      body <- tryCatch(
        fromJSON(raw),
        error = function(e) NULL
      )
    }
  }
  return(body)
}

#' Convert data frame to list of lists for JSON
df_to_list <- function(df) {
  if (is.null(df) || nrow(df) == 0) return(list())
  lapply(1:nrow(df), function(i) as.list(df[i, ]))
}
