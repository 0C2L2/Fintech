# ============================================
# Database Connection & Helpers
# ============================================

library(DBI)
library(RSQLite)
library(uuid)

# Database path - works in both local and Docker environments
if (dir.exists("/app")) {
  DB_PATH <- file.path("/app", "data", "finhealth.db")
} else {
  DB_PATH <- file.path(getwd(), "data", "finhealth.db")
}

#' Get database connection
get_db <- function() {
  # Ensure data directory exists
  dir.create(dirname(DB_PATH), showWarnings = FALSE, recursive = TRUE)
  
  con <- dbConnect(RSQLite::SQLite(), DB_PATH)
  dbExecute(con, "PRAGMA foreign_keys = ON")
  dbExecute(con, "PRAGMA journal_mode = WAL")
  return(con)
}

#' Initialize database from schema
init_db <- function() {
  con <- get_db()
  on.exit(dbDisconnect(con))
  
  if (dir.exists("/app")) {
    schema_path <- file.path("/app", "schema.sql")
  } else {
    schema_path <- file.path(getwd(), "schema.sql")
  }
  if (file.exists(schema_path)) {
    sql_lines <- readLines(schema_path, warn = FALSE)
    # Remove single line comments
    sql_lines <- sql_lines[!grepl("^\\s*--", sql_lines)]
    sql_text <- paste(sql_lines, collapse = "\n")
    
    # Split by semicolons and execute each statement
    statements <- unlist(strsplit(sql_text, ";"))
    for (stmt in statements) {
      stmt <- trimws(stmt)
      if (nchar(stmt) > 0 && !grepl("^\\s*PRAGMA", stmt)) {
        tryCatch(
          dbExecute(con, paste0(stmt, ";")),
          error = function(e) {
            # Ignore errors for IF NOT EXISTS statements
            if (!grepl("already exists", e$message, ignore.case = TRUE)) {
              message("SQL Warning: ", e$message)
            }
          }
        )
      }
    }
    message("Database initialized successfully.")
  } else {
    stop("Schema file not found at: ", schema_path)
  }
}


#' Generate a new UUID
new_uuid <- function() {
  UUIDgenerate()
}

#' Execute a query and return results as data.frame
db_query <- function(sql, params = NULL) {
  con <- get_db()
  on.exit(dbDisconnect(con))
  
  if (is.null(params)) {
    result <- dbGetQuery(con, sql)
  } else {
    result <- dbGetQuery(con, sql, params = params)
  }
  return(result)
}

#' Execute a statement (INSERT, UPDATE, DELETE)
db_execute <- function(sql, params = NULL) {
  con <- get_db()
  on.exit(dbDisconnect(con))
  
  if (is.null(params)) {
    result <- dbExecute(con, sql)
  } else {
    result <- dbExecute(con, sql, params = params)
  }
  return(result)
}

#' Get a single row
db_get_one <- function(sql, params = NULL) {
  result <- db_query(sql, params)
  
  if (nrow(result) == 0) return(NULL)
  return(as.list(result[1, , drop = FALSE]))
}

#' Check if a record exists
db_exists <- function(table, field, value) {
  sql <- sprintf("SELECT COUNT(*) as cnt FROM %s WHERE %s = ?", table, field)
  result <- db_query(sql, params = list(value))
  return(result$cnt[1] > 0)
}
