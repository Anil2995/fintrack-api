# Finance Backend

A backend API for a finance dashboard system with role-based access control, built with Node.js, Express, and MongoDB.

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

# 4. Start in dev mode
npm run dev
```

The server starts on `http://localhost:5000` by default.

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
│   │   ├── recordService.js    # Record CRUD + filtering + pagination
│   │   └── dashboardService.js # Aggregation endpoints
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   └── errorHandler.js     # AppError class + central error handler
│   ├── app.js                  # Express app setup
│   └── server.js               # Entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## Roles

| Role | Can do |
|---|---|
| **viewer** | Read financial records (`GET /api/records`) |
| **analyst** | Everything viewer can do + create/update records + access dashboard analytics |
| **admin** | Full access — manage users, delete records, all analyst permissions |

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

Response includes a `token` field. Pass this in the `Authorization: Bearer <token>` header for all protected routes.

---

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get a single user |
| PUT | `/api/users/:id` | Update role or isActive status |
| DELETE | `/api/users/:id` | Delete a user |

**PUT /api/users/:id** — body can include:
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
| GET | `/api/records` | viewer, analyst, admin | List records with optional filters |
| GET | `/api/records/:id` | viewer, analyst, admin | Get a single record |
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

**GET /api/records — query parameters:**

| Param | Example | Description |
|---|---|---|
| `type` | `?type=expense` | Filter by type |
| `category` | `?category=food` | Case-insensitive category match |
| `startDate` | `?startDate=2025-01-01` | Records from this date |
| `endDate` | `?endDate=2025-03-31` | Records up to this date |
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=10` | Results per page (default: 20, max: 100) |

---

### Dashboard (Analyst and Admin)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Total income, expense, net balance, category breakdown, recent activity |
| GET | `/api/dashboard/trends/monthly` | Income vs expense grouped by month (last 12 months) |
| GET | `/api/dashboard/trends/weekly` | Income vs expense grouped by ISO week (last 8 weeks) |

**GET /api/dashboard/summary — example response:**
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

All errors follow this shape:

```json
{
  "success": false,
  "message": "Descriptive error message here."
}
```

| Status | Meaning |
|---|---|
| 400 | Bad request — validation failed or invalid input |
| 401 | Unauthenticated — missing or invalid token |
| 403 | Forbidden — authenticated but wrong role |
| 404 | Resource not found |
| 500 | Unexpected server error |

---

## Design Decisions and Assumptions

**Soft deletes for records** — when a record is "deleted" via the API, it gets an `isDeleted: true` flag rather than being removed. This keeps an audit trail. A Mongoose pre-find hook automatically filters these out of all normal queries, so they're invisible without touching the flag.

**Password field exclusion** — the User schema marks `password` with `select: false`. It never shows up in query results unless explicitly requested. The login handler asks for it with `.select("+password")`.

**Role hierarchy** — the three roles form an ascending privilege ladder: viewer → analyst → admin. Each level includes everything the level below can do, plus more.

**Self-modification prevention** — admins cannot update or delete their own account through the user management endpoints. This avoids situations where someone accidentally removes their own admin access.

**No separate controllers layer** — I kept handlers in the `services/` directory. For a project this size, adding a separate controllers folder would just mean moving the same code around. The services are small enough to be readable as-is.

**Token expiry** — JWT tokens expire based on `JWT_EXPIRES_IN` in the env file (default: 7 days). There's no refresh token mechanism — the assumption is that for an internal dashboard, re-login every week is acceptable.

---

## Quick Test Flow (Postman / Thunder Client)

1. `POST /api/auth/register` — create an admin user with `"role": "admin"`
2. `POST /api/auth/login` — copy the token from the response
3. Set `Authorization: Bearer <token>` in headers
4. `POST /api/records` — create a few records
5. `GET /api/dashboard/summary` — verify aggregations work
6. `GET /api/records?type=expense&page=1` — test filtering
7. Create a viewer account and verify `POST /api/records` returns 403

---

## Health Check

```
GET /health
```

Returns `{ "status": "ok" }` — useful for confirming the server is up without auth.
