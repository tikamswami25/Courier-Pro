# 📬 CourierPro – Courier Management System

Task ID: WD-LOG-006 · Student Code: DAS-LOG-006 · Data Alcott Systems
Task link: https://www.freeinternships.in/blog/

Frontend-only courier management app built with HTML, CSS and JavaScript. No database: data is kept in JS arrays and saved in `localStorage`.

## Features
- Login / Register (simulated, demo: `admin@courierpro.com` / `admin123`)
- Dashboard with stats, status chart, recent bookings
- Booking management (add, edit, delete, search, filter)
- Shipment tracking with timeline and simulated SMS/email notifications
- Delivery personnel, routes and customers management
- Billing and invoices (generate, mark paid, print)
- Reports with CSV export and print/PDF
- Dark mode, responsive layout with hamburger menu

## Run locally
Option 1: double-click `index.html`.
Option 2 (recommended): `python -m http.server 5500` in this folder, then open http://localhost:5500
Option 3: VS Code → Live Server extension → "Go Live".

## Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: CourierPro"
git branch -M main
git remote add origin https://github.com/your-username/courier-pro-system.git
git push -u origin main
```

## Deploy (live website)
GitHub repo → Settings → Pages → Branch `main` / root → Save. Or drag the folder to Netlify.

## Tech
HTML5, CSS3, JavaScript (ES6), Font Awesome icons.
