# MediCore – Hospital Management System

React (Vite) + Redux Toolkit + Tailwind CSS + React-Toastify + React Icons  |  Node.js + Express  |  MySQL

## Run it (Laragon)
1. Start Laragon (Apache/Nginx not needed, only **MySQL**).
2. Backend
   ```
   cd server
   cp .env.example .env        # edit DB_PASSWORD if your Laragon root user has one
   npm install
   npm run setup               # creates hospital_db + tables, seeds admin user, units, services
   npm run dev                 # http://localhost:5000
   ```
3. Frontend
   ```
   cd client
   npm install
   npm run dev                 # http://localhost:5173  (proxies /api to :5000)
   ```
4. Sign in: **admin@hospital.com / admin123** (change it under Administration → User management).

## How the modules connect
- Medicine purchase / sales / returns, general purchases and stock usage automatically adjust stock. Stock can never go negative.
- Patient bills (Patient list) keep `due = amount - discount - paid - collected`. Due collection raises `collected`; Refund raises `refunded`.
- Setting a Discount request to Approved adds the discount to the bill.
- Reports (financial, income/expense, collection, due, medicine, total) are computed live with a date range, print and CSV export.
- Roles: `*` = everything, or a comma list of page keys (e.g. `patients,appointments`) to restrict the sidebar and routes.

## Notes
- Each purchase/sale record holds one item (no multi-line invoices yet).
- Page restriction by role is enforced in the UI; add server-side checks before production use.
- Set a strong `JWT_SECRET` in `server/.env`.


# Next work 
 - a patient can create a account for take Dr appointment, show his/her medical track, or a gaust patient just take a dr appointment.
