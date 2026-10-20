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

 # Next work 
 - remove stuff login button from patient portal
 - Patient Portal Home Page UI need more Intersting Slider, Dr Information(Most Popular), Patient service and there Price, Gallary, where all should be managable from admin side. 
 - Book an appointment form for Dr. select use (Dr. Name field and Dr. Department) to find the spacific Dr. Like I want Dr. X so When I write X in the Name Here I can Show all the Dr who have this name then I will select my choise dr. or I will select the dr department then show all dr on those department I will find Dr. x on this department and select the dr. 


## Next work 
 - Need a Footer About Us, Privacy Policy, Our Service, Find a Doctor, Publication, Contact Us create all this page link in the footer, Social Link, Logo, Address, Footer UI in patient portal looks should be professional. 

 - Header UI is also need to be change logo, address and other needed page add in header.

 all should be manageable by the admin side logo, social like, address, publication