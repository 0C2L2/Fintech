# ============================================
# K-Means Clustering Module
# ============================================

library(cluster)

# Cluster label mapping
CLUSTER_LABELS <- c(
  "Balanced Budgeter",
  "High Saver",
  "Rent-Burdened User",
  "Entertainment-Heavy Spender"
)

#' Assign financial segment to a user based on features
#' @param features Named list from build_feature_vector()
#' @return Character string: cluster label
assign_cluster <- function(features) {
  # Try loading saved model
  model_path <- file.path(dirname(getwd()), "backend-r", "models", "kmeans_model.rds")
  scaler_path <- file.path(dirname(getwd()), "backend-r", "models", "scaler_params.rds")
  
  if (file.exists(model_path) && file.exists(scaler_path)) {
    # Use trained model
    tryCatch({
      model <- readRDS(model_path)
      scaler <- readRDS(scaler_path)
      
      # Prepare feature vector
      feature_vec <- data.frame(
        rent_share = features$rent_share,
        food_share = features$food_share,
        transport_share = features$transport_share,
        education_share = features$education_share,
        entertainment_share = features$entertainment_share,
        savings_rate = features$savings_rate
      )
      
      # Scale using saved parameters
      scaled <- scale(feature_vec, center = scaler$center, scale = scaler$scale)
      scaled[is.nan(scaled)] <- 0
      
      # Predict cluster
      distances <- apply(model$centers, 1, function(center) {
        sum((scaled - center)^2)
      })
      cluster_id <- which.min(distances)
      
      # Map to label
      if (cluster_id <= length(CLUSTER_LABELS)) {
        return(CLUSTER_LABELS[cluster_id])
      }
      
      return(CLUSTER_LABELS[1])
    }, error = function(e) {
      message("Clustering model error, falling back to rules: ", e$message)
      return(rule_based_segment(features))
    })
  } else {
    # Fallback: rule-based segmentation
    return(rule_based_segment(features))
  }
}

#' Rule-based segmentation fallback
#' @param features Named list from build_feature_vector()
#' @return Character string: segment label
rule_based_segment <- function(features) {
  savings_rate <- features$savings_rate
  rent_share <- features$rent_share
  entertainment_share <- features$entertainment_share
  food_share <- features$food_share
  
  # High Saver: savings rate > 25%
  if (savings_rate > 0.25) {
    return("High Saver")
  }
  
  # Rent-Burdened: rent > 40% of expenses
  if (rent_share > 0.40) {
    return("Rent-Burdened User")
  }
  
  # Entertainment-Heavy: entertainment > 20% of expenses
  if (entertainment_share > 0.20) {
    return("Entertainment-Heavy Spender")
  }
  
  # Default: Balanced Budgeter
  return("Balanced Budgeter")
}
