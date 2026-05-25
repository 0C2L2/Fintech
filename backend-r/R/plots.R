# ============================================
# Admin Visualization Plots Module
# ggplot2 4.x compatible (positional margin())
# ============================================

library(ggplot2)
library(scales)

# ---- Shared theme (ggplot2 4.x + randomForest compatible) ----
# NOTE: randomForest masks ggplot2::margin — must use ggplot2::margin() explicitly
finhealth_theme <- function() {
  theme_minimal(base_size = 13) +
    theme(
      plot.title       = element_text(face = "bold", size = 15, color = "#1e293b",
                                      margin = ggplot2::margin(0, 0, 6, 0)),
      plot.subtitle    = element_text(size = 11, color = "#64748b",
                                      margin = ggplot2::margin(0, 0, 14, 0)),
      plot.caption     = element_text(size = 9, color = "#94a3b8", hjust = 0,
                                      margin = ggplot2::margin(10, 0, 0, 0)),
      plot.background  = element_rect(fill = "white", color = NA),
      panel.background = element_rect(fill = "white", color = NA),
      panel.grid.major = element_line(color = "#f1f5f9", linewidth = 0.6),
      panel.grid.minor = element_blank(),
      axis.text        = element_text(color = "#64748b", size = 10),
      axis.title       = element_text(color = "#475569", size = 11),
      legend.position  = "bottom",
      legend.title     = element_blank(),
      legend.text      = element_text(size = 10, color = "#475569"),
      plot.margin      = ggplot2::margin(16, 20, 12, 16)
    )
}

SEGMENT_COLORS <- c(
  "Balanced Budgeter"            = "#3b82f6",
  "High Saver"                   = "#10b981",
  "Rent-Burdened User"           = "#f59e0b",
  "Entertainment-Heavy Spender"  = "#ef4444"
)

# ============================================
# 1. Feature Vector — which features feed what
# ============================================
plot_feature_vector <- function() {
  features <- data.frame(
    feature    = c("Savings Rate", "Rent Share", "Entertainment Share",
                   "Food Share", "Transport Share", "Education Share",
                   "Expense Growth", "Avg Savings (3m)"),
    importance = c(10, 9, 8, 7, 6, 5, 7, 8),
    used_in    = c("Clustering + Score + Prediction",
                   "Clustering + Overspending",
                   "Clustering + Overspending",
                   "Overspending",
                   "Overspending",
                   "Clustering",
                   "Overspending",
                   "Prediction"),
    stringsAsFactors = FALSE
  )
  features$feature <- factor(features$feature, levels = rev(features$feature))

  ggplot(features, aes(x = feature, y = importance, fill = used_in)) +
    geom_col(width = 0.65) +
    geom_text(aes(label = used_in), hjust = -0.05, size = 3.2, color = "#475569") +
    coord_flip(clip = "off") +
    scale_y_continuous(expand = expansion(mult = c(0, 1.4)), breaks = NULL) +
    scale_fill_brewer(palette = "Set2", guide = "none") +
    labs(
      title    = "Feature Vector — What Each Feature Is Used For",
      subtitle = "8 features are extracted per user-month and feed clustering, scoring, and prediction",
      x        = NULL,
      y        = NULL,
      caption  = "Source: build_feature_vector() in features.R"
    ) +
    finhealth_theme() +
    theme(panel.grid.major.x = element_blank())
}

# ============================================
# 2. User Segmentation — live counts from DB
# ============================================
plot_segmentation <- function() {
  segments <- db_query(
    "SELECT cluster_label AS segment, COUNT(*) AS count
     FROM analysis_results
     WHERE cluster_label IS NOT NULL
     GROUP BY cluster_label
     ORDER BY count DESC"
  )

  if (nrow(segments) == 0) {
    segments <- data.frame(segment = names(SEGMENT_COLORS), count = c(0, 0, 0, 0))
  }

  segments$pct   <- round(segments$count / max(sum(segments$count), 1) * 100, 1)
  segments$label <- paste0(segments$count, " users (", segments$pct, "%)")

  seg_colors <- SEGMENT_COLORS[segments$segment]
  seg_colors[is.na(seg_colors)] <- "#94a3b8"
  names(seg_colors) <- segments$segment

  ggplot(segments, aes(x = reorder(segment, count), y = count, fill = segment)) +
    geom_col(width = 0.65, show.legend = FALSE) +
    geom_text(aes(label = label), hjust = -0.08, size = 3.8, color = "#1e293b") +
    coord_flip(clip = "off") +
    scale_fill_manual(values = seg_colors) +
    scale_y_continuous(expand = expansion(mult = c(0, 0.45))) +
    labs(
      title    = "User Segmentation — K-Means Clustering (live)",
      subtitle = "4 segments assigned via trained K-Means model or rule-based fallback",
      x        = NULL,
      y        = "Number of users",
      caption  = "Source: analysis_results table  |  assign_cluster() in clustering.R"
    ) +
    finhealth_theme()
}

# ============================================
# 3. Overspending Thresholds — rules.R
# ============================================
plot_overspending_rules <- function() {
  rules <- data.frame(
    category  = c("Rent", "Food", "Transport", "Entertainment", "Education", "Discretionary"),
    threshold = c(40,     30,     25,           20,              15,          40),
    severity  = c("high", "medium", "low",      "medium",        "low",       "medium"),
    stringsAsFactors = FALSE
  )
  rules$category <- factor(rules$category, levels = rev(rules$category))

  ggplot(rules, aes(x = category, y = threshold, fill = severity)) +
    geom_col(width = 0.6) +
    geom_text(aes(label = paste0(threshold, "%")), hjust = -0.2,
              size = 4.5, fontface = "bold", color = "#1e293b") +
    coord_flip(clip = "off") +
    scale_fill_manual(
      values = c("high" = "#ef4444", "medium" = "#f59e0b", "low" = "#22c55e"),
      labels = c("high" = "High severity", "medium" = "Medium severity", "low" = "Low severity")
    ) +
    scale_y_continuous(limits = c(0, 62), labels = function(x) paste0(x, "%")) +
    labs(
      title    = "Overspending Detection — Category Thresholds (rules.R)",
      subtitle = "A flag is raised when a category's share of spending exceeds this limit",
      x        = NULL,
      y        = "Max allowed % of total spending",
      caption  = "Source: FINANCIAL_RULES in rules.R  |  detect_overspending() in overspending.R"
    ) +
    finhealth_theme()
}

# ============================================
# 4. Overspending — live issue frequency
# ============================================
plot_overspending_frequency <- function() {
  results <- db_query(
    "SELECT overspending_flags FROM analysis_results
     WHERE overspending_flags IS NOT NULL
     ORDER BY created_at DESC LIMIT 200"
  )

  issue_counts <- list()
  if (nrow(results) > 0) {
    for (i in seq_len(nrow(results))) {
      flags_json <- results$overspending_flags[i]
      if (!is.null(flags_json) && nchar(flags_json) > 2) {
        tryCatch({
          flags <- fromJSON(flags_json)
          if (is.data.frame(flags) && "issue" %in% names(flags)) {
            for (iss in flags$issue) {
              issue_counts[[iss]] <- (issue_counts[[iss]] %||% 0) + 1
            }
          }
        }, error = function(e) NULL)
      }
    }
  }

  if (length(issue_counts) == 0) {
    df <- data.frame(issue = "No data yet — run analyses first", count = 1, severity = "info",
                     stringsAsFactors = FALSE)
  } else {
    df <- data.frame(
      issue = names(issue_counts),
      count = unlist(issue_counts),
      stringsAsFactors = FALSE
    )
    df <- df[order(df$count, decreasing = TRUE), ]

    sev_map <- c(
      "Spending exceeds income"     = "critical",
      "Low savings rate"            = "high",
      "High rent burden"            = "high",
      "High entertainment spending" = "medium",
      "High food spending"          = "medium",
      "Rapid expense growth"        = "medium",
      "High discretionary spending" = "medium",
      "High transport costs"        = "low"
    )
    df$severity <- vapply(df$issue, function(x) {
      m <- sev_map[x]
      if (is.na(m)) "medium" else m
    }, character(1))
  }

  df$issue <- factor(df$issue, levels = rev(df$issue))

  ggplot(df, aes(x = issue, y = count, fill = severity)) +
    geom_col(width = 0.65) +
    geom_text(aes(label = count), hjust = -0.2, size = 4, fontface = "bold", color = "#1e293b") +
    coord_flip(clip = "off") +
    scale_fill_manual(
      values = c("critical" = "#dc2626", "high" = "#ea580c",
                 "medium"   = "#d97706", "low"  = "#65a30d", "info" = "#2563eb"),
      labels = c("critical" = "Critical", "high" = "High",
                 "medium"   = "Medium",   "low"  = "Low",    "info" = "Info")
    ) +
    scale_y_continuous(expand = expansion(mult = c(0, 0.3))) +
    labs(
      title    = "Live Overspending Issue Frequency",
      subtitle = "Count of each flag type across the last 200 stored analysis results",
      x        = NULL,
      y        = "Occurrences",
      caption  = "Source: analysis_results.overspending_flags  |  detect_overspending() in overspending.R"
    ) +
    finhealth_theme()
}

# ============================================
# 5. Financial Score — scoring formula
# ============================================
plot_score_formula <- function() {
  rules <- data.frame(
    step   = c("Base score", "Critical flag (−25)", "High flag (−15)",
                "Medium flag (−10)", "Low flag (−5)",
                "Savings > 20% (+10)", "Savings > 30% (+5)"),
    points = c(100, -25, -15, -10, -5, 10, 5),
    type   = c("base", "deduct", "deduct", "deduct", "deduct", "bonus", "bonus"),
    stringsAsFactors = FALSE
  )
  rules$step  <- factor(rules$step, levels = rev(rules$step))
  rules$label <- ifelse(rules$points > 0, paste0("+", rules$points), as.character(rules$points))

  ggplot(rules, aes(x = step, y = points, fill = type)) +
    geom_col(width = 0.65, show.legend = FALSE) +
    geom_text(
      aes(label = label, hjust = ifelse(points >= 0, -0.15, 1.15)),
      size = 4.5, fontface = "bold", color = "#1e293b"
    ) +
    coord_flip(clip = "off") +
    scale_fill_manual(values = c("base" = "#3b82f6", "deduct" = "#ef4444", "bonus" = "#10b981")) +
    scale_y_continuous(limits = c(-32, 120)) +
    labs(
      title    = "Financial Score — How Points Are Calculated",
      subtitle = "Starts at 100. Each flag deducts points by severity; savings bonus can add up to +15.",
      x        = NULL,
      y        = "Points",
      caption  = "Source: calculate_financial_score() in overspending.R"
    ) +
    finhealth_theme()
}

# ============================================
# 6. Financial Score — live distribution
# ============================================
plot_score_distribution <- function() {
  scores <- db_query(
    "SELECT financial_score FROM analysis_results WHERE financial_score IS NOT NULL"
  )

  if (nrow(scores) == 0 || all(is.na(scores$financial_score))) {
    scores <- data.frame(financial_score = c(85, 90, 72, 65, 50, 40, 95, 80, 75, 60, 55, 100))
  }

  scores$band <- cut(scores$financial_score,
                     breaks = c(-Inf, 49, 79, 100),
                     labels = c("Needs attention (0-49)", "Moderate (50-79)", "Excellent (80-100)"))

  band_colors <- c(
    "Needs attention (0-49)" = "#ef4444",
    "Moderate (50-79)"       = "#f59e0b",
    "Excellent (80-100)"     = "#10b981"
  )

  ggplot(scores, aes(x = financial_score, fill = band)) +
    geom_histogram(binwidth = 5, color = "white", linewidth = 0.4) +
    geom_vline(xintercept = 50, linetype = "dashed", color = "#f59e0b", linewidth = 0.9) +
    geom_vline(xintercept = 80, linetype = "dashed", color = "#10b981", linewidth = 0.9) +
    scale_fill_manual(values = band_colors) +
    scale_x_continuous(breaks = seq(0, 100, 10)) +
    labs(
      title    = "Financial Score Distribution Across All Users",
      subtitle = "Scores < 50 = Needs attention  |  50-79 = Moderate  |  80-100 = Excellent",
      x        = "Financial Score (0-100)",
      y        = "Number of analyses",
      caption  = "Source: analysis_results.financial_score  |  calculate_financial_score() in overspending.R"
    ) +
    finhealth_theme() +
    theme(legend.position = "none")
}

# ============================================
# 7. Savings Prediction — trend method
# ============================================
plot_savings_prediction <- function() {
  history <- db_query(
    "SELECT month,
            AVG(income)                    AS avg_income,
            AVG(total_expense)             AS avg_expense,
            AVG(income - total_expense)    AS avg_savings
     FROM monthly_snapshots
     WHERE income > 0
     GROUP BY month
     ORDER BY month ASC
     LIMIT 12"
  )

  if (nrow(history) < 2) {
    history <- data.frame(
      month       = c("2025-11-01", "2025-12-01", "2026-01-01"),
      avg_income  = c(4800, 5000, 5100),
      avg_expense = c(3600, 3900, 3800),
      avg_savings = c(1200, 1100, 1300)
    )
  }

  history$t <- seq_len(nrow(history))
  history$month_label <- format(as.Date(history$month), "%b %Y")

  lm_fit  <- lm(avg_savings ~ t, data = history)
  next_t  <- max(history$t) + 1
  predicted <- as.numeric(predict(lm_fit, newdata = data.frame(t = next_t)))

  trend_df <- data.frame(t = c(history$t, next_t),
                         fitted = c(lm_fit$fitted.values, predicted))

  next_label <- paste0("Predicted\n$", round(predicted, 0))
  all_labels <- c(history$month_label, next_label)

  ggplot() +
    geom_col(data = history, aes(x = t, y = avg_income),
             fill = "#10b981", alpha = 0.22, width = 0.45) +
    geom_col(data = history, aes(x = t, y = avg_expense),
             fill = "#ef4444", alpha = 0.35, width = 0.45) +
    geom_line(data = history, aes(x = t, y = avg_savings, color = "Actual savings"),
              linewidth = 1.6) +
    geom_point(data = history, aes(x = t, y = avg_savings, color = "Actual savings"),
               size = 3.5) +
    geom_line(data = trend_df, aes(x = t, y = fitted, color = "Linear trend"),
              linewidth = 1.1, linetype = "dashed") +
    geom_point(aes(x = next_t, y = predicted, color = "Prediction"),
               size = 6, shape = 18) +
    geom_label(aes(x = next_t, y = predicted, label = paste0("$", round(predicted, 0))),
               hjust = -0.15, color = "#7c3aed", fontface = "bold",
               size = 3.8, fill = "white", label.size = 0.3) +
    scale_x_continuous(breaks = c(history$t, next_t), labels = all_labels) +
    scale_y_continuous(labels = dollar_format()) +
    scale_color_manual(values = c(
      "Actual savings" = "#3b82f6",
      "Linear trend"   = "#94a3b8",
      "Prediction"     = "#7c3aed"
    )) +
    labs(
      title    = "Savings Prediction — Linear Trend Method (fallback)",
      subtitle = "Green bars=Income, Red bars=Expenses, Blue line=Actual savings, Diamond=Next-month prediction",
      x        = NULL,
      y        = "Amount (USD)",
      caption  = "Source: monthly_snapshots  |  simple_predict_savings() in prediction.R  (RF model used when available)"
    ) +
    finhealth_theme() +
    theme(axis.text.x = element_text(size = 8.5, lineheight = 1.1))
}
