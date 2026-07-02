# Restaurant Reservation Management System

A production-style full-stack reservation system built with React, Node.js, Express, MongoDB, and JWT authentication.

## Live Demo

Frontend

https://restaurant-reservation-system-lp2z6nnpo.vercel.app

Backend

https://restaurant-reservation-system-cfy2.onrender.com

Health Endpoint

https://restaurant-reservation-system-cfy2.onrender.com/api/health


## Features

- Customer registration and login
- Admin login and admin-only dashboard
- Create, view, and cancel reservations
- Automatic table assignment by capacity
- Conflict prevention for overlapping bookings on the same table
- Table management for admins
- Centralized validation and error handling
- Clean repo structure for deployment

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas
- Auth: JWT
- Validation: Zod

## Project Structure

```text
restaurant-reservation-system
│
├── backend
│   ├── src
│   │   ├── config
│   │   │   └── db.js
│   │   │
│   │   ├── controllers
│   │   │   ├── authController.js
│   │   │   ├── reservationController.js
│   │   │   └── tableController.js
│   │   │
│   │   ├── middlewares
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   │
│   │   ├── models
│   │   │   ├── User.js
│   │   │   ├── Table.js
│   │   │   └── Reservation.js
│   │   │
│   │   ├── routes
│   │   │   ├── authRoutes.js
│   │   │   ├── reservationRoutes.js
│   │   │   └── tableRoutes.js
│   │   │
│   │   ├── validators
│   │   │   ├── authSchemas.js
│   │   │   ├── reservationSchemas.js
│   │   │   └── tableSchemas.js
│   │   │
│   │   ├── utils
│   │   │   ├── apiError.js
│   │   │   └── time.js
│   │   │
│   │   ├── test
│   │   │   ├── app.test.js
│   │   │   └── setup.js
│   │   │
│   │   ├── app.js
│   │   ├── server.js
│   │   └── seed.js
│   │
│   ├── .env.example
│   ├── jest.config.js
│   └── package.json
│
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── Field.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── pages
│   │   │   ├── AuthPage.jsx
│   │   │   ├── CustomerDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── state
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── .env.example
│   ├── index.html
│   ├── vercel.json
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Environment Variables

### Backend (.env)

```env
MONGODB_URI=

JWT_ACCESS_SECRET=

JWT_EXPIRES_IN=7d

CORS_ORIGIN=

ADMIN_SEED_EMAIL=

ADMIN_SEED_PASSWORD=

ADMIN_SEED_NAME=
```

### Frontend (.env)

```env
VITE_API_URL=
```

## Free MongoDB connection

Use MongoDB Atlas free tier.

1. Create a free Atlas account.
2. Create a free shared cluster.
3. Add your IP address to the access list.
4. Create a database user.
5. Click **Connect** on the cluster and copy the connection string into `backend/.env` as `MONGODB_URI`.

MongoDB Atlas free clusters can be created from the Atlas UI. Before connecting, create a database user and add your IP address to the access list. Then copy the connection string from the cluster Connect dialog into your backend `.env`.

Atlas documents its free tier / free cluster offering as free to use for learning and development.

### Example connection string

```env
MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLUSTER.mongodb.net/restaurant_reservation?retryWrites=true&w=majority
```

## Assumptions

- Single restaurant
- Fixed set of tables
- Reservations are made within one restaurant day and one time window
- Restaurant hours are treated as 10:00 to 23:00
- Admin accounts are created by the seed script
- Customers can register themselves

## Reservation logic

When a reservation is created:

1. The backend validates date, time, and guest count.
2. It checks all active tables that can fit the guest count.
3. If a preferred table is selected, the system tries only that table.
4. It compares the requested time range with existing confirmed reservations on the same date.
5. The first available table with enough capacity is assigned.
6. If no table is available, the request fails with a clear 409 conflict.

Overlap is checked with the standard interval rule:

- overlap exists when `requestedStart < existingEnd` and `requestedEnd > existingStart`

This prevents double bookings for the same table.

## Role-based access

- **Customer** can:
  - create reservations
  - see their own reservations
  - cancel their own reservations

- **Admin** can:
  - see all reservations
  - filter reservations by date
  - cancel any reservation
  - update any reservation
  - create/update/deactivate tables

JWT tokens carry the role, and backend middleware enforces access.

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Set `MONGODB_URI` in `.env` using your Atlas connection string.

Then seed tables and the admin account:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

Production start:

```bash
npm start
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Default admin login

After seeding:

- Email: `admin@restaurant.com`
- Password: `Admin123@`

You can change this in `backend/.env` before running the seed script.

## Testing the application

### Manual API checks

Health check:

```bash
GET /api/health
```

Register customer:

```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

Create reservation:

```bash
POST /api/reservations
Authorization: Bearer <token>
{
  "date": "2026-07-10",
  "startTime": "18:00",
  "endTime": "19:30",
  "guests": 4,
  "notes": "Birthday dinner"
}
```

Admin fetch all reservations:

```bash
GET /api/reservations
Authorization: Bearer <admin token>
```

### Backend test command

```bash
cd backend
npm test
```

## Deployment

### Backend

Deploy the backend to Render, Railway, or any Node host.

Set environment variables:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `NODE_ENV=production`

Start command:

```bash
npm start
```

### Frontend

Deploy the frontend to Vercel, Netlify, or similar.

Set:

- `VITE_API_URL=https://restaurant-reservation-system-cfy2.onrender.com/api`

Build command:

```bash
npm run build
```

## API Response Codes

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict (Table unavailable)
- 500 Internal Server Error

```md
## Security

- JWT Authentication
- Passwords hashed using bcrypt
- Helmet security headers
- Request validation using Zod
- Environment variables for secrets
- CORS protection

## Known limitations

- No payment flow
- No real-time updates
- No email notifications
- No floor-plan visualization
- Table selection is simple and capacity-based

## Areas to improve later

- Add pagination and search for admin dashboards
- Add audit logs for admin actions
- Add reservation rescheduling
- Add E2E tests with Playwright/Cypress
- Add Docker compose for one-command local startup
