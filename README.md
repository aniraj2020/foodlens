# FoodLens – Visualizing & Predicting Food Insecurity in Melbourne

**FoodLens** is a full-stack web application that empowers users to explore, analyze, and predict food insecurity trends using open government data from the City of Melbourne. It offers interactive visualizations, real-time feedback, and predictive analytics to support better decision-making for communities and policymakers.

---

## Features

- **User Authentication**
  - Register, Login, Logout via Passport.js
  - Admin and Normal User roles
  - Real-time welcome messages using Socket.IO
- **Interactive Dashboards**
  - Insecurity Types Pie Chart
  - Demographic-based Bar Charts
  - Combined Trends Comparison (Grouped Bar)
  - Insight Explorer (Multi-line by Category)
  - Future Trend Prediction via Linear Regression
- **Admin Panel**
  - View all registered users and their roles
- **Data Preprocessing**
  - Cleaned CSV data
  - Jupyter notebook for transformation & EDA
  - Seed script to import data into MongoDB

---

## Tech Stack

| Layer        | Technologies                                  |
|--------------|-----------------------------------------------|
| Frontend     | HTML, CSS (Materialize), Vanilla JS, Chart.js |
| Backend      | Node.js, Express.js                           |
| Database     | MongoDB + Mongoose                            |
| Auth         | Passport.js (Local), bcryptjs                 |
| Real-time    | Socket.IO                                     |
| View Engine  | EJS                                           |
| Data Parsing | csv-parser + Python (Jupyter Notebook)        |

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aniraj2020/foodlens.git
cd foodlens
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a .env File

Create a `.env` file in the root directory and add your MongoDB URI (example below):

```
MONGO_URI=mongodb://localhost:27017/foodlens
```

### 4. Seed the Database

```bash
node seed/seedData.js
```

### 5. Run the App

```bash
npm run start
```

---

## Project Structure

```
foodlens/
├── config/              # MongoDB connection logic (db.js)
├── controllers/         # Logic for handling requests (auth, dashboard, admin, etc.)
├── models/              # Mongoose schemas/models (User, FoodSecurity)
├── routes/              # Express route definitions (auth, API endpoints)
├── views/               # EJS templates for UI rendering (login, home, charts)
├── public/              # Static frontend assets (JavaScript, CSS, client-side logic)
├── seed/                # Script to import cleaned data into MongoDB (seedData.js)
├── data/                # Cleaned CSV files used in the app
├── foodlens_data_preprocessing.ipynb  # Jupyter notebook for data preprocessing and EDA
├── server.js            # Main Express server entry point
├── .env                 # Environment variables (MongoDB URI, etc.)
├── package.json         # Project metadata and dependencies
```

---

## Admin Access

To grant admin rights to a user, run the following command in your MongoDB shell:

```bash
db.users.updateOne({ username: "your_username" }, { $set: { role: "admin" } })
```

---
###  Backend Architecture Diagram

![FoodLens Backend Architecture](./assets/flowChart.png)

---

## License & Data Source

This project is built for academic and demonstration purposes.  
Data sourced from: [City of Melbourne Open Data Portal](https://data.melbourne.vic.gov.au/)

---

**Enjoy exploring FoodLens!**

---
