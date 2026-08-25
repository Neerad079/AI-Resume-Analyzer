# HireIQ — AI-Powered Resume Analyzer

> Analyze resumes against job descriptions, generate personalized outreach, and land more interviews.

Built for the **RazorPay AI BuildAthon — August 2026** by Neerad S Ramesh.

---

## 🚀 Features

- **Resume × JD Analyzer** — AI-powered match scores (0–100), skills gap reports, keyword suggestions, and ATS risk flags
- **Outreach Generator** — Auto-draft LinkedIn DMs (≤300 chars), cold emails, and cover letter blurbs personalized to each company
- **Application History** — Save, view, and track analyses over time with full CRUD operations
- **JWT Authentication** — Secure user registration and login with BCrypt password hashing

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.3, Java 17 |
| AI | NVIDIA API |
| Database | MySQL 8.0 + Hibernate/JPA |
| Security | Spring Security + JWT |
| Frontend | React 19 + Vite |
| Deploy | Docker + Docker Compose |

## 📁 Project Structure

```
AI Job Assistant/
├── backend/                    # Spring Boot API
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/hireiq/
│       ├── HireIqApplication.java
│       ├── config/             # JWT, Security, CORS
│       ├── controller/         # REST endpoints
│       ├── dto/                # Request/Response DTOs
│       ├── exception/          # Global error handling
│       ├── model/              # JPA entities
│       ├── repository/         # Data access
│       └── service/            # Business logic + AI
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── api.js              # Axios API client
│   │   ├── context/            # Auth context
│   │   ├── components/         # Navbar, ProtectedRoute
│   │   └── pages/              # Dashboard, Analyze, Outreach, History
│   └── index.html
├── docker-compose.yml
└── README.md
```

## 🛠️ Setup & Run

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0 (or Docker)
- Anthropic API key

### 1. Database (Docker)
```bash
docker compose up mysql -d
```

### 2. Backend
```bash
cd backend
# Set environment variables
export CLAUDE_API_KEY=your-key-here
export MYSQL_PASSWORD=root

# Build & run
./mvnw spring-boot:run
```
Backend starts at `http://localhost:8080`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend starts at `http://localhost:5173`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NVIDIA_API_KEY` | *(required)* | NVIDIA API key |
| `MYSQL_HOST` | localhost | MySQL host |
| `MYSQL_PORT` | 3306 | MySQL port |
| `MYSQL_DB` | hireiq | Database name |
| `MYSQL_USER` | root | MySQL username |
| `MYSQL_PASSWORD` | root | MySQL password |
| `JWT_SECRET` | *(built-in)* | JWT signing key |

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login |
| POST | `/api/analysis/match` | ✅ | Analyze resume vs JD |
| POST | `/api/outreach/generate` | ✅ | Generate outreach messages |
| GET | `/api/history` | ✅ | List saved analyses |
| POST | `/api/history` | ✅ | Save analysis |
| DELETE | `/api/history/{id}` | ✅ | Delete analysis |

## 👤 Author

**Neerad S Ramesh**
B.Tech CSE · NIT Srinagar
[GitHub](https://github.com/Neerad079) · 
