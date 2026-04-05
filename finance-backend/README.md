# Finance Data Processing and Access Control Backend

A RESTful backend API for a finance dashboard system — built with **Node.js**, **Express**, and **MongoDB**.

---

## Tech Stack

| Layer       | Choice             |
|-------------|--------------------|
| Runtime     | Node.js            |
| Framework   | Express.js         |
| Database    | MongoDB + Mongoose |
| Auth        | JWT (jsonwebtoken) |
| Passwords   | bcryptjs           |
| Validation  | express-validator  |

---

## Project Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection
├── middleware/
│   ├── auth.js                # JWT verification + role guard
│   └── validate.js            # express-validator rules
├── models/
│   ├── User.js                # User schema (name, email, role, isActive)
│   └── Record.js              # Financial record schema (amount, type, category...)
├── routes/
│   ├── authRoutes.js          # /api/auth
│   ├── userRoutes.js          # /api/users
│   ├── recordRoutes.js        # /api/records
│   └── dashboardRoutes.js     # /api/dashboard
├── services/
│   ├── authService.js         # Register, login, getMe logic
│   ├── userService.js         # Admin user management
│   ├── recordService.js       # CRUD + filtering for financial records
│   └── dashboardService.js    # Aggregation queries for analytics
├── utils/
│   └── errorHandler.js        # AppError class + global error middleware
├── app.js                     # Express app setup
└── server.js                  # Entry point
```

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo-url>
cd finance-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_db
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

### 3. Run the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`

---

## Roles and Permissions

| Action                      | Viewer | Analyst | Admin |
|-----------------------------|--------|---------|-------|
| Login / Register            | ✅     | ✅      | ✅    |
| View financial records      | ✅     | ✅      | ✅    |
| Create / Update records     | ❌     | ✅      | ✅    |
| Delete records (soft)       | ❌     | ❌      | ✅    |
| View dashboard + analytics  | ❌     | ✅      | ✅    |
| Manage users                | ❌     | ❌      | ✅    |

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint          | Auth | Description          |
|--------|-------------------|------|----------------------|
| POST   | `/register`       | No   | Create a new user    |
| POST   | `/login`          | No   | Login and get token  |
| GET    | `/me`             | Yes  | Get logged-in user   |

**Register body:**
```json
{
  "name": "Anil Kumar",
  "email": "anil@example.com",
  "password": "secure123",
  "role": "analyst"
}
```

**Login body:**
```json
{
  "email": "anil@example.com",
  "password": "secure123"
}
```

**Login response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "Anil Kumar", "role": "analyst" }
}
```

---

### Users — `/api/users` *(Admin only)*

| Method | Endpoint    | Description                     |
|--------|-------------|---------------------------------|
| GET    | `/`         | List all users                  |
| GET    | `/:id`      | Get user by ID                  |
| PUT    | `/:id`      | Update user role or active flag |
| DELETE | `/:id`      | Delete a user                   |

**Update user body:**
```json
{
  "role": "analyst",
  "isActive": false
}
```

---

### Financial Records — `/api/records`

| Method | Endpoint | Auth Role        | Description                    |
|--------|----------|------------------|--------------------------------|
| GET    | `/`      | All              | List records (filter + paginate)|
| GET    | `/:id`   | All              | Get single record              |
| POST   | `/`      | Analyst, Admin   | Create a record                |
| PUT    | `/:id`   | Analyst, Admin   | Update a record                |
| DELETE | `/:id`   | Admin            | Soft delete a record           |

**Create/Update record body:**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2025-01-15",
  "notes": "January salary"
}
```

**Supported query filters:**
```
GET /api/records?type=expense&category=Food&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=10
```

---

### Dashboard — `/api/dashboard` *(Analyst + Admin)*

| Method | Endpoint           | Description                            |
|--------|--------------------|----------------------------------------|
| GET    | `/summary`         | Totals, net balance, category breakdown, recent records |
| GET    | `/trends/monthly`  | Income vs expense per month (12 months)|
| GET    | `/trends/weekly`   | Income vs expense per week (8 weeks)   |

**Summary response:**
```json
{
  "success": true,
  "summary": {
    "totalIncome": 50000,
    "totalExpense": 32000,
    "netBalance": 18000
  },
  "categoryBreakdown": [
    { "type": "income", "category": "Salary", "total": 50000, "count": 1 }
  ],
  "recentActivity": [...]
}
```

---

## Error Handling

All errors return a consistent shape:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action."
}
```

| Status | Meaning                          |
|--------|----------------------------------|
| 400    | Validation error / bad input     |
| 401    | Unauthenticated (no/invalid JWT) |
| 403    | Forbidden (wrong role)           |
| 404    | Resource not found               |
| 500    | Internal server error            |

---

## Design Decisions and Assumptions

1. **Soft deletes on records** — Records are never permanently removed (`isDeleted: true`). This preserves audit history. A Mongoose middleware automatically hides them from all queries.

2. **Viewers cannot see analytics** — Dashboard routes require at least `analyst` role. The rationale is that raw data viewing (records list) is public within the system, but aggregated financial insights are restricted.

3. **Admins cannot modify themselves** — To prevent accidental self-lockout, admin role changes and deactivations on one's own account are blocked.

4. **Passwords excluded by default** — The User schema uses `select: false` on the password field so it is never accidentally returned in any query.

5. **Pagination defaults** — Records default to page 1, 20 per page if no query params are given.

6. **JWT in Authorization header** — Standard `Bearer <token>` format. No cookie-based auth to keep the API stateless and simple.

7. **Category is a free-text field** — No predefined enum for categories. This keeps the system flexible for different business contexts.

---

## Optional Features Included

- ✅ JWT Authentication
- ✅ Soft delete for records
- ✅ Pagination on record listing
- ✅ Filtering by type, category, date range
- ✅ Monthly and weekly trend analytics
- ✅ Consistent error responses with status codes
