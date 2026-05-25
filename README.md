# FinHealth — Consumer Finance MVP

> A full-stack personal finance platform powered by an **R Plumber** ML backend and a **Next.js 15** frontend. Users track income and expenses, receive AI-generated spending alerts, segment-based recommendations, and downloadable Excel reports. Admins get live ggplot2 analytics visualizations.

---

## Screenshots

### User Views

**Login**
![Login](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/01_login.png)

**Dashboard** — spending overview, category pie chart, trend line
![User Dashboard](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/02_user_dashboard.png)

**Income** — monthly income management
![Income](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/03_income.png)

**Expenses** — add and manage expense records with category selector
![Expenses](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/04_expenses.png)

**Categories** — manage spending categories with per-category budget thresholds
![Categories](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/05_categories.png)

**Analysis** — ML-powered financial score, overspending flags, segment, and personalized recommendations
![Analysis](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/06_analysis.png)

**Reports** — download full Excel report (.xlsx)
![Reports](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/07_reports.png)

---

### Admin Panel

**Admin Dashboard — Top** — platform-wide metrics and user segmentation
![Admin Dashboard Top](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/08_admin_dashboard_top.png)

**Admin Dashboard — Overspending & Score** — live issue frequency and scoring formula
![Admin Dashboard Mid](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/09_admin_dashboard_mid.png)

**Admin Dashboard — Prediction & Recommendations** — savings prediction methodology and recommendation engine
![Admin Dashboard Bottom](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/10_admin_dashboard_bot.png)

**R Algorithm Plots — Top** — live ggplot2 charts: feature vector, segmentation, and overspending rules
![Admin R Plots Top](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/11_admin_plots_top.png)

**R Algorithm Plots — Mid** — live overspending frequency and financial score formula charts
![Admin R Plots Mid](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/12_admin_plots_mid.png)

**Database Explorer** — raw SQLite table browser for admin
![Admin Database](https://raw.githubusercontent.com/0C2L2/fintech/main/screenshots/13_admin_database.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts |
| Backend | R 4.6 + Plumber REST API |
| Database | SQLite via RSQLite |
| ML / Analytics | K-Means clustering, Random Forest, ggplot2 |
| Auth | JWT (jose) |
| Reports | openxlsx (Excel .xlsx) |

---

## Project Structure

```
finteach/
├── backend-r/
│   ├── R/
│   │   ├── admin.R          # Admin API endpoints + plot endpoints
│   │   ├── auth.R           # JWT login/register/middleware
│   │   ├── categories.R     # Category CRUD + budget thresholds
│   │   ├── clustering.R     # K-Means segmentation (4 user types)
│   │   ├── db.R             # SQLite connection helpers
│   │   ├── expenses.R       # Expense CRUD + monthly aggregation
│   │   ├── features.R       # Feature vector builder (8 metrics)
│   │   ├── income.R         # Income / monthly snapshot management
│   │   ├── overspending.R   # 9-rule flag detector + financial score
│   │   ├── plots.R          # ggplot2 visualization functions (7 plots)
│   │   ├── prediction.R     # RF + linear regression savings forecast
│   │   ├── recommendations.R# Personalized advice engine (3 types)
│   │   ├── reports.R        # Excel report generator (5 sheets)
│   │   ├── rules.R          # FINANCIAL_RULES thresholds constants
│   │   └── utils.R          # Shared helpers
│   ├── scripts/
│   │   ├── seed_100_users.R     # Seed 100 demo users with expenses
│   │   ├── train_clustering.R   # Train + save K-Means model (.rds)
│   │   └── train_prediction.R   # Train + save Random Forest model (.rds)
│   ├── models/              # Trained .rds files (git-ignored)
│   ├── data/                # finhealth.db SQLite file (git-ignored)
│   ├── plumber.R            # API entrypoint (all routes)
│   ├── run.R                # Server startup script
│   ├── schema.sql           # Database schema
│   └── install_packages.R   # One-time R package installer
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/       # User home — overview + charts
│   │   ├── income/          # Monthly income management
│   │   ├── expenses/        # Expense CRUD with category selector
│   │   ├── categories/      # Category manager + per-category budgets
│   │   ├── analysis/        # Full ML analysis: score, flags, recs
│   │   ├── reports/         # Download Excel report
│   │   ├── admin/
│   │   │   ├── dashboard/   # Platform-wide stats + live charts
│   │   │   ├── plots/       # 7 live R ggplot2 algorithm explainers
│   │   │   └── database/    # Raw table browser
│   │   ├── login/
│   │   └── register/
│   ├── components/
│   │   ├── RPlot.tsx        # Fetches + renders PNG from R backend
│   │   ├── Sidebar.tsx      # Role-aware navigation
│   │   ├── SpendingPieChart.tsx
│   │   └── TrendLineChart.tsx
│   ├── lib/
│   │   ├── api.ts           # All API call wrappers
│   │   └── auth-context.tsx # JWT auth state provider
│   └── types/index.ts       # Shared TypeScript types
│
├── database/
│   ├── schema.sql           # Canonical DB schema
│   └── seed.sql             # Example seed data
└── scripts/
    └── smoke_test.ps1       # End-to-end API health check
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **R** ≥ 4.4 (tested on 4.6)
- **Git**

### 1. Clone

```bash
git clone https://github.com/0C2L2/fintech.git
cd fintech
```

### 2. Install R Packages

```r
# Run once inside backend-r/
Rscript install_packages.R
```

Required packages: `plumber`, `RSQLite`, `DBI`, `jsonlite`, `jose`, `openssl`, `openxlsx`, `ggplot2`, `scales`, `dplyr`, `tidyr`, `randomForest`

### 3. Start the R Backend

```bash
cd backend-r
Rscript run.R
# → API listening on http://localhost:8000
# → Swagger docs at http://localhost:8000/__docs__/
```

The database (`data/finhealth.db`) and an admin account are created automatically on first run.

**Default admin credentials:**
```
Email:    admin@finhealth.com
Password: admin123
```

### 4. Start the Next.js Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 5. (Optional) Seed Demo Data + Train ML Models

```bash
# Seed 100 demo users with 12 months of realistic expense history
Rscript scripts/seed_100_users.R

# Train K-Means clustering model (saves models/kmeans_model.rds)
Rscript scripts/train_clustering.R

# Train Random Forest savings prediction (saves models/rf_savings_model.rds)
Rscript scripts/train_prediction.R
```

---

## Core Algorithms

### 1. Feature Engineering — `features.R`

For every user-month, 8 features are computed from raw expense records:

| Feature | Formula |
|---|---|
| `savings_rate` | `(income − total_expense) / income` |
| `rent_share` | `rent / total_expense` |
| `food_share` | `food / total_expense` |
| `transport_share` | `transport / total_expense` |
| `entertainment_share` | `entertainment / total_expense` |
| `education_share` | `education / total_expense` |
| `expense_growth` | `(this_month − last_month) / last_month` |
| `avg_savings_last_3m` | Rolling 3-month mean of actual surplus |

---

### 2. User Segmentation — `clustering.R`

Users are assigned to one of **4 segments**:

| Segment | Condition |
|---|---|
| 💰 High Saver | `savings_rate > 25%` |
| 🏠 Rent-Burdened User | `rent > 40%` of total expenses |
| 🎬 Entertainment-Heavy Spender | `entertainment > 20%` of total expenses |
| ⚖️ Balanced Budgeter | Default (no other rule fires) |

**Primary:** Trained K-Means model (`models/kmeans_model.rds`) — features are scaled and the nearest centroid is found via Euclidean distance.  
**Fallback:** Rule-based priority cascade (High Saver → Rent-Burdened → Entertainment-Heavy → Balanced Budgeter).

---

### 3. Overspending Detection — `overspending.R` + `rules.R`

Nine rules are checked per analysis. Each produces a flag with severity:

| Rule | Threshold | Severity |
|---|---|---|
| Rent share | > 40% | High |
| Low savings rate | < 10% of income | High |
| Budget exceeded (custom) | User-set per-category | High |
| Food share | > 30% | Medium |
| Expense growth | > 20% MoM | Medium |
| Entertainment share | > 20% | Medium |
| Discretionary total | > 40% | Medium |
| Transport share | > 25% | Low |
| Spending exceeds income | expenses > income | **Critical** |

---

### 4. Financial Score — `overspending.R`

```
score = 100
score -= 25  per Critical flag
score -= 15  per High flag
score -= 10  per Medium flag
score -= 5   per Low flag
score += 10  if savings_rate > 20%
score += 5   if savings_rate > 30%
score = clamp(score, 0, 100)
```

Bands: **80–100** Excellent · **50–79** Moderate · **0–49** Needs attention

---

### 5. Savings Prediction — `prediction.R`

1. **Random Forest** (`models/rf_savings_model.rds`) — 10 input features, trained on historical user data
2. **Fallback:** `lm(savings ~ t)` — linear regression over last 6 months of snapshots
3. **Last resort** (< 2 months history): `income − total_expense`

A **negative prediction** triggers a Critical recommendation.

---

### 6. Recommendation Engine — `recommendations.R`

Three layers of advice, generated in order:

1. **Flag-based** — each of the 9 overspending flags maps to a specific action + estimated dollar impact
2. **Segment-based** — extra advice for Entertainment-Heavy Spenders and High Savers (fires only if not already covered by flags)
3. **Prediction-based** — critical alert if `predicted_savings < 0`

If no issues are found: `"You're doing well — consider increasing savings."`

---

### 7. Excel Reports — `reports.R`

Generated with `openxlsx`. Each report has **5 sheets**:

| Sheet | Contents |
|---|---|
| Summary | Income, total expenses, savings, financial score, prediction |
| Expenses | All expense records for the selected month |
| Category Breakdown | Spending per category + % share + budget threshold |
| Analysis | Overspending flags, segment, recommendations |
| Trends | Last 6 months of income / expense / savings history |

---

## Admin Dashboard

Accessible at `/admin/dashboard` and `/admin/plots` (admin login required).

### `/admin/dashboard`
- Platform metrics (users, expenses, total spending, reports)
- Live segment distribution pie chart
- Segment cards with live counts
- Overspending rules reference
- Live issue frequency bar chart
- Financial score formula breakdown
- Savings prediction methodology
- Recommendation engine documentation
- Full user table

### `/admin/plots`
Seven live **ggplot2** charts rendered as PNGs by the R backend and served via authenticated endpoints:

| Plot | Endpoint |
|---|---|
| Feature vector usage | `GET /api/admin/plots/feature-vector` |
| Segmentation distribution | `GET /api/admin/plots/segmentation` |
| Category thresholds | `GET /api/admin/plots/overspending-rules` |
| Live issue frequency | `GET /api/admin/plots/overspending-frequency` |
| Score formula | `GET /api/admin/plots/score-formula` |
| Score distribution | `GET /api/admin/plots/score-distribution` |
| Savings prediction trend | `GET /api/admin/plots/savings-prediction` |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Returns JWT token |
| POST | `/api/auth/register` | Create new user |
| GET | `/api/auth/me` | Current user info |

### User Endpoints (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/expenses` | List / create expenses |
| GET/PUT/DELETE | `/api/expenses/:id` | Manage single expense |
| GET/POST | `/api/categories` | List / create categories |
| GET/POST | `/api/income` | Monthly income snapshots |
| POST | `/api/analyze` | Run full ML analysis |
| GET | `/api/reports/download` | Download Excel (.xlsx) |

### Admin Endpoints (admin JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/overview` | Platform stats |
| GET | `/api/admin/segments` | User segment distribution |
| GET | `/api/admin/overspending` | Aggregated flag counts |
| GET | `/api/admin/users` | All users + spending totals |
| GET | `/api/admin/plots/:type` | PNG plot images |

---

## Environment

Create `frontend/.env.local` from the example:

```bash
cp frontend/.env.local.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## License

MIT
