# **StackAuth**

StackAuth is a lightweight authentication + payment starter kit that integrates **Google OAuth** for secure user sign-in and **Paystack** for seamless payments.
Built with **Node.js**, **TypeScript**, **PostgreSQL**, and **TypeORM**.

This project serves as my **Stage Seven project for the HNG Internship**, demonstrating full-stack proficiency in authentication, payment processing, and modern backend development patterns.

---

## **Features**

### **Authentication**

* Google OAuth 2.0 Login
* Secure JWT-based session management
* Refresh token flow
* Role-based access structure for future extension

### **Payments**

* Paystack standard payment integration
* Payment verification endpoint
* Basic transaction recording (TypeORM + PostgreSQL)
* Webhook-ready structure

### **Backend Tech Stack**

* **Node.js + TypeScript**
* **Express**
* **PostgreSQL**
* **TypeORM**
* **Zod** for request validation
* **JWT** for authentication
* **dotenv** for config

---

## **Folder Structure**

```
stack-auth/
├── src
│   ├── config/
│   │   └── data-source.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── payment.controller.ts
│   ├── entities/
│   │   ├── User.ts
│   │   └── Transaction.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── payment.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── payment.service.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── paystack.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## **Environment Variables**

Create a `.env` file using:

```
PORT=3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=

# Paystack
PAYSTACK_SECRET_KEY=

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_NAME=stackauth
```

---

## **Running Locally**

### Install dependencies

```bash
npm install
```

### Run database migrations (if applicable)

```bash
npm run migration:run
```

### Start the dev server

```bash
npm run dev
```

---

## **API Endpoints Overview**

### **Auth**

| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | `/auth/google`          | Redirect to Google OAuth |
| GET    | `/auth/google/callback` | Google callback          |
| GET    | `/auth/me`              | Get authenticated user   |

### **Payments**

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| POST   | `/payment/initialize`        | Start a Paystack payment |
| GET    | `/payment/verify/:reference` | Verify completed payment |


## 🏁 **Why This Project?**

This project is designed to demonstrate:

* Real-world authentication flow
* Secure payment integration
* Clean architecture with services + controllers
* SQL database modelling with TypeORM
* Production-ready Node backend patterns

It showcases practical backend engineering skills as part of my **HNG Internship Stage Seven** deliverables.

---

## **Author**

**Ebube Anyanwu**
HNG Internship – Stage Seven Project
