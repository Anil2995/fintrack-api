# Finance Backend — fintrack-api

> 🚀 **Live API & Interactive Demo:** [https://fintrack-apifintrack-api.onrender.com](https://fintrack-apifintrack-api.onrender.com)
> 
> **Health check:** `GET /health` → `{"status":"ok"}`
>
> ⚠️ *Note: Hosted on Render's free tier. It may take ~30 seconds to wake up on the first request if inactive.*

A complete backend API for a finance dashboard system with role-based access control, built with **Node.js, Express, and MongoDB**.

---

### 🔑 Demo Credentials

To test the Live API immediately (or via Postman), you can use these pre-seeded accounts:

| **Role** | **Email** | **Password** | **Access Level** |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@finance.dev` | `admin123` | Full CRUD, user management, and advanced analytics |
| **Analyst** | `analyst@finance.dev` | `analyst123` | Create/view/update records and view trend analytics |
| **Viewer** | `viewer@finance.dev` | `viewer123` | View dashboard summaries and read-only records |

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB (via Mongoose) |
| Auth | JWT (jsonwebtoken) |
| Validation | express-validator |
| Password hashing | bcryptjs |
| Rate limiting | express-rate-limit |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Setup

```bash
# 1. Clone and enter the project
git clone <your-repo-url>
cd finance-backend

# 2. Install dependencies
npm install

# 3. Create your env file
cp .env.example .env
# Open .env and fill in MONGO_URI and JWT_SECRET

# 4. Seed test data (optional but recommended)
npm run seed

# 5. Start in dev mode
npm run dev
```

The server starts on `http://localhost:5000` by default, and serves the **Interactive Demo** on the root URL `/`. All API endpoints are prefixed with `/api`.

---

## Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── models/
│   │   ├── User.js             # User schema with role + isActive
│   │   └── Record.js           # Financial record schema with soft delete
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + restrictTo guards
│   │   └── validate.js         # Input validation rules
│   ├── services/
│   │   ├── authService.js      # Register, login, getMe
│   │   ├── userService.js      # Admin user CRUD
│   │   ├── recordService.js    # Record CRUD + filtering + search + pagination
│   │   └── dashboardService.js # Aggregation endpoints
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   └── errorHandler.js     # AppError class + central error handler
│   ├── app.js                  # Express app setup + rate limiting
│   └── server.js               # Entry point
├── seed.js                     # Populates DB with sample data for testing
├── .env.example
├── .gitignore
└── package.json
```

---

## Roles and Permissions

| Action | viewer | analyst | admin |
|---|:---:|:---:|:---:|
| View financial records | ✅ | ✅ | ✅ |
| Create records | ❌ | ✅ | ✅ |
| Update records | ❌ | ✅ | ✅ |
| Delete records (soft) | ❌ | ❌ | ✅ |
| View dashboard summary | ✅ | ✅ | ✅ |
| View monthly/weekly trends | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create a new user |
| POST | `/api/auth/login` | None | Log in, get a token |
| GET | `/api/auth/me` | Any role | Get the current user's profile |

**POST /api/auth/register**
```json
{
  "name": "Anil Kumar",
  "email": "anil@example.com",
  "password": "secret123",
  "role": "admin"
}
```

**POST /api/auth/login**
```json
{
  "email": "anil@example.com",
  "password": "secret123"
}
```

Response includes a `token` field. Pass this in all protected requests:
```
Authorization: Bearer <token>
```

---

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get a single user |
| PUT | `/api/users/:id` | Update role or isActive status |
| DELETE | `/api/users/:id` | Delete a user |

**PUT /api/users/:id**
```json
{
  "role": "analyst",
  "isActive": false
}
```

---

### Financial Records

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/records` | All | List records with optional filters |
| GET | `/api/records/:id` | All | Get a single record |
| POST | `/api/records` | analyst, admin | Create a record |
| PUT | `/api/records/:id` | analyst, admin | Update a record |
| DELETE | `/api/records/:id` | admin | Soft delete a record |

**POST /api/records**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2025-03-01",
  "notes": "March salary"
}
```

**GET /api/records — query parameters**

| Param | Example | Description |
|---|---|---|
| `type` | `?type=expense` | Filter by income or expense |
| `category` | `?category=food` | Case-insensitive category match |
| `search` | `?search=salary` | Keyword search across category + notes |
| `startDate` | `?startDate=2025-01-01` | Records from this date |
| `endDate` | `?endDate=2025-03-31` | Records up to this date |
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=10` | Results per page (default: 20, max: 100) |

---

### Dashboard

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | All | Totals, category breakdown, recent activity |
| GET | `/api/dashboard/trends/monthly` | analyst, admin | Income vs expense by month (last 12) |
| GET | `/api/dashboard/trends/weekly` | analyst, admin | Income vs expense by ISO week (last 8) |

**GET /api/dashboard/summary — example response**
```json
{
  "success": true,
  "summary": {
    "totalIncome": 95000,
    "totalExpense": 42000,
    "netBalance": 53000
  },
  "categoryBreakdown": [
    { "type": "income", "category": "Salary", "total": 80000, "count": 2 }
  ],
  "recentActivity": [...]
}
```

---

## Error Handling

All errors follow a consistent shape:

```json
{
  "success": false,
  "message": "Descriptive message here."
}
```

| Status | Meaning |
|---|---|
| 400 | Bad request — validation failed or invalid input |
| 401 | Unauthenticated — missing or invalid token |
| 403 | Forbidden — authenticated but insufficient role |
| 404 | Resource not found |
| 429 | Too many requests — rate limit hit |
| 500 | Unexpected server error |

---

## Rate Limiting

- **All routes**: 100 requests per 15 minutes per IP
- **Auth routes** (`/api/auth/*`): 20 requests per 15 minutes per IP  
  This tighter limit is specifically to make brute force login attacks impractical.

---

## Design Decisions and Assumptions

**Soft deletes for records** — records get `isDeleted: true` instead of being removed. This keeps an audit trail. A Mongoose pre-find hook hides them automatically from all normal queries.

**Viewer dashboard access** — viewers can see the `/api/dashboard/summary` endpoint (total income, expense, net balance). The requirement says "Viewer: Can only view dashboard data," so this makes sense. Trend analytics are analyst-only since those are deeper insights, not just a summary.

**Password field exclusion** — the User schema marks `password` with `select: false`. It never appears in API responses. Login explicitly re-selects it with `.select("+password")`.

**Self-modification prevention** — admins can't update or delete their own account through the user management API. This prevents accidental self-lockout.

**No separate controllers layer** — the service files contain both business logic and response handling. For a project this size, splitting into controllers and services would just move the same code around with no real benefit. The services are small enough to stay readable as-is.

**Search vs. category filter** — `?category=` does an exact case-insensitive match on the category field. `?search=` is broader — it checks both category and notes. Both can coexist separately.

**Token expiry** — JWTs expire based on `JWT_EXPIRES_IN` in the env (default 7 days). No refresh token mechanism — for an internal finance dashboard this is a fine tradeoff.

---

## Quick Test Flow

```
1. npm run seed                         # populate test data
2. POST /api/auth/login                 # login as admin, grab token
3. GET  /api/records                    # list records
4. GET  /api/records?search=salary      # keyword search
5. GET  /api/records?type=expense&page=1 # filtered + paginated
6. POST /api/records                    # create a new record
7. GET  /api/dashboard/summary          # aggregated totals
8. GET  /api/dashboard/trends/monthly  # monthly trend data
9. Login as viewer, try POST /records   # should 403
10. Login as viewer, GET /dashboard/summary # should work (200)
```

---

## Health Check

```
GET /health
```

Returns `{ "status": "ok" }` — no auth required.
