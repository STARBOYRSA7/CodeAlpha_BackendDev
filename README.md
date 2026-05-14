# CodeAlpha Backend Development Internship — Sizwe Sigubudu

Three backend web applications built with **Express.js (Node.js)**, **lowdb (JSON database)**, and full HTML/CSS/JS frontends.

---

## Task Overview

| Task | App | Backend | Auth | Port |
|---|---|---|---|---|
| Task 1 | URL Shortener | Express.js + lowdb + nanoid | None | 3000 |
| Task 2 | Event Registration System | Express.js + lowdb + JWT | bcryptjs + JWT | 3001 |
| Task 3 | Restaurant Management System | Express.js + lowdb | None | 3002 |

---

## Running Locally

Each task is an independent Express.js server. Run them separately:

```bash
# Task 1 — URL Shortener
cd task1-urlshortener
npm install
npm start
# Open http://localhost:3000

# Task 2 — Event Registration
cd task2-events
npm install
npm start
# Open http://localhost:3001

# Task 3 — Restaurant Manager
cd task3-restaurant
npm install
npm start
# Open http://localhost:3002
```

## API Endpoints

### Task 1 — URL Shortener
```
POST   /api/shorten              Create short URL (body: { url, customCode? })
GET    /api/urls                 List all shortened URLs
GET    /api/urls/:code/stats     Stats for a specific short URL
DELETE /api/urls/:code           Delete a short URL
GET    /:code                    Redirect to original URL
```

### Task 2 — Event Registration
```
POST   /api/auth/register        Register user
POST   /api/auth/login           Login, returns JWT token

GET    /api/events               List all events (query: category, search)
GET    /api/events/:id           Get event details
POST   /api/events               Create event (auth required)
DELETE /api/events/:id           Delete event (auth required)

POST   /api/registrations        Register for event (auth required)
GET    /api/registrations/my     My registrations (auth required)
DELETE /api/registrations/:id    Cancel registration (auth required)
```

### Task 3 — Restaurant Management
```
GET    /api/menu                 List menu (query: category)
POST   /api/menu                 Add menu item
PATCH  /api/menu/:id             Update item (toggle availability etc.)
DELETE /api/menu/:id             Remove item

GET    /api/orders               List orders (query: status)
POST   /api/orders               Place order
PATCH  /api/orders/:id/status    Update order status

GET    /api/tables               List all tables
PATCH  /api/tables/:id           Update table status

GET    /api/reservations         List reservations
POST   /api/reservations         Create reservation
DELETE /api/reservations/:id     Cancel reservation

GET    /api/inventory            List inventory
PATCH  /api/inventory/:id        Update stock quantity

GET    /api/reports/daily        Today's revenue, orders, low stock
```

## Deploying to Railway (Free)

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the task subfolder as root
4. Railway auto-detects Node.js and runs `npm start`
5. Set `PORT` env variable if needed (Railway handles this automatically)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js v4
- **Database:** lowdb v1 (JSON file, zero-config, pure JS)
- **Auth:** bcryptjs + jsonwebtoken (Task 2)
- **Short codes:** nanoid (Task 1)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript

---

**Built for CodeAlpha Backend Development Internship**
Sizwe Sigubudu | sizwesigubudu7@gmail.com | github.com/STARBOYRSA7
