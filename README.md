
---
 🗂️ Leave Management System (MERN Stack)

A **full-stack Leave Management System** built using **React, Node.js, Express, MongoDB**, designed for **Employees and Managers** to efficiently manage leave requests, approvals, balances, and team calendars.

---

## 🚀 Live Demo

* **Frontend:** [https://leave-mangement-sys-frontend1.onrender.com](https://leave-mangement-sys-frontend1.onrender.com)
* **Backend API:** [https://leave-mangement-sys-backend.onrender.com](https://leave-mangement-sys-backend.onrender.com)

---

📌 Features

👨‍💼 Employee

* Apply for leave (Casual / Sick / Earned)
* View leave balance
* Track leave status (Pending / Approved / Rejected / Cancelled)
* Cancel pending leave requests
* View manager comments

👩‍💼 Manager

* can provide approvel or reject leave
* View team leave requests
* Approve or reject leave with comments
* Edit employee leave balances
* View team leave history
* View team leave calendar (approved leaves)

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* React Router DOM
* Context API (Authentication)
* Fetch API
* CSS (Corporate UI Styling)

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT Authentication
* RESTful APIs

### Deployment

* **Frontend:** Render
* **Backend:** Render
* **Database:** MongoDB Atlas

---

📂 Project Structure

```
leave_management_system/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
│
├── frontend1/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── styles/
│   │   └── config.js
│   └── vite.config.js
│
└── README.md
```

---

 🔐 Authentication Flow

* JWT based authentication
* Token stored in `localStorage`
* Protected routes for:

  * Employees
  * Managers
* Role-based access control

---

 🧪 API Endpoints (Sample)

### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
```
Employee

POST   /api/leave/apply
GET    /api/leave/my
GET    /api/leave/balance
PATCH  /api/leave/cancel/:id

Manager


GET    /api/manager/leave/team
PATCH  /api/manager/leave/approve/:id
PATCH  /api/manager/leave/reject/:id
GET    /api/manager/leave/calendar
PATCH  /api/manager/leave/edit-balance/:id
```



⚙️ Environment Variables

Backend `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Frontend `.env`

```env
VITE_API_URL=https://leave-mangement-sys-backend.onrender.com
```



▶️ Run Locally

Backend

```bash
cd backend
npm install
npm start
```
Frontend

```bash
cd frontend1
npm install
npm run dev
```



 ✅ Key Fixes Implemented

* JWT payload compatibility (`userId` / `id`)
* Leave type normalization
* Enum mismatch resolved (`casual`, `sick`, `earned`)
* One component per file
* Build-safe React structure
* Production-ready deployment



 📌 Future Enhancements

* employee role
* manager role
* Leave analytics dashboard
* Public holidays support
* Pagination & filters



👨‍🎓 Author

  Deepesh G
MCA – 3rd Semester
Dr. Ambedkar Institute of Technology

🔗 GitHub: [https://github.com/Deepesh-G](https://github.com/Deepesh-G)
🔗 Project Repo: [https://github.com/Deepesh-G/leave_mangement_sys](https://github.com/Deepesh-G/leave_mangement_sys)



⭐ Acknowledgements

* MongoDB Atlas
* Render
* React & Express communities


