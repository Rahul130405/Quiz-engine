# ⚡ QuizEngine

### *An Intelligent Algorithm-Driven Quiz Platform*

<p align="center">
  <b>Adaptive Learning • Real-Time Scoring • Graph-Based Progression</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-MongoDB-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Deployment-Docker-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

---

## 🚀 Overview

**QuizEngine** is a full-stack, algorithm-powered quiz platform designed to deliver a **smart, adaptive, and engaging learning experience**.

It combines:

* 🧠 **Data Structures & Algorithms**
* ⚡ **Real-time interaction**
* 🌐 **Modern full-stack architecture**

to create a **production-ready intelligent learning system**.

---

## ✨ Key Highlights

* ⚡ Algorithm-driven quiz logic
* 🔗 Graph-based topic unlocking (DAG)
* 📊 Real-time leaderboard system
* 🔐 Secure authentication (JWT)
* 🐳 Docker-ready deployment

---

## 🧠 Core Features

### 🧠 Smart Algorithms

* Fisher–Yates Shuffle (O(n), unbiased randomization)
* Greedy scoring with streak bonuses
* DAG-based topic progression (Topological Sort)
* Multi-condition sorting system

---

### 🎮 Interactive Experience

* Real-time quiz interface
* Countdown timer + progress tracking
* Smooth UI transitions
* Dark/Light mode support
* Fully responsive design

---

### 🔐 Security & Authentication

* JWT-based authentication system
* Protected routes & middleware
* Admin-controlled data operations

---

### 📊 Analytics & Performance

* Dynamic leaderboard ranking
* Quiz history tracking
* Score visualization
* Performance-based topic unlocking

---

## 🏗️ System Architecture

```mermaid id="arch001"
graph TD
A[React Frontend] --> B[API Layer]
B --> C[Node.js Backend]
C --> D[MongoDB Database]
```

---

## 🧠 Algorithm Engine (Core Strength)

### 🔀 Fisher–Yates Shuffle

Ensures true randomness in quiz sessions with O(n) complexity.

---

### ⚡ Greedy Scoring Logic

* +5 → Correct
* −1 → Incorrect (min = 0)
* 🔥 Streak bonuses:

  * 3 correct → +2
  * 5 correct → +5

---

### 🔗 Topological Sort (DAG)

* Topic unlocking based on prerequisites
* Ensures structured learning progression
* Implemented using Kahn’s Algorithm

---

### 📊 Advanced Sorting

* Leaderboard → score desc + name tie-break
* Questions → difficulty-based ordering
* Multi-field comparator system

---

## 🏗️ Learning Path Graph

```
HTML → CSS → JavaScript → React
                     ↘
                      Node.js → Full Stack
```

---

## 📸 Screenshots

<p align="center">
  <img src="./assets/home.png" width="80%" />
  <img src="./assets/quiz.png" width="80%" />
  <img src="./assets/leaderboard.png" width="80%" />
</p>

---

## 🌐 Live Demo

👉 https://your-app-link

---

## ⚙️ Installation Guide

### 🔹 Backend Setup

```bash id="bk1"
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

---

### 🔹 Frontend Setup

```bash id="fr1"
cd frontend
npm install
npm start
```

---

## 🐳 Docker Deployment

```bash id="dk1"
docker-compose up --build
docker-compose exec backend node data/seed.js
```

---

## 💡 Why This Project?

✔ Combines **DSA + Full Stack Development**
✔ Demonstrates **real-world system design**
✔ Implements **scalable architecture**
✔ Showcases **problem-solving + engineering thinking**

---

## 🚀 Future Enhancements

* 🤖 AI-based adaptive difficulty
* 🌐 Multiplayer quiz system
* ⚡ WebSocket real-time updates
* 📊 Advanced analytics dashboard
* 📱 Mobile app version

---

## 👨‍💻 Author

**Rahul Raj Jaiswal**

🔗 GitHub: https://github.com/yourusername
💼 LinkedIn: https://www.linkedin.com/in/rahulrajjaiswal/

---

## 📄 License

This project is licensed under the MIT License.
