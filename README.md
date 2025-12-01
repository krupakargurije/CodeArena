# CodeArena - Competitive Programming Platform

A full-stack competitive programming platform built with React and Spring Boot, featuring real-time code execution, leaderboards, and a professional modern UI.

## 🚀 Features

- **Authentication**: JWT-based signup/login with Spring Security
- **Problem Management**: CRUD operations for coding problems with difficulty levels
- **Code Editor**: Monaco Editor integration with multi-language support
- **Code Execution**: Mock code runner with test case validation
- **Real-time Updates**: WebSocket integration for submission results
- **Leaderboards**: Rating-based competitive rankings
- **User Profiles**: Track solved problems, submissions, and ratings
- **Admin Panel**: User and problem management
- **Professional UI**: Modern glassmorphism design with purple gradient theme

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **Axios** for API calls
- **WebSocket** (SockJS + STOMP) for real-time updates

### Backend
- **Spring Boot 3.2** (Java 17)
- **Spring Security** with JWT authentication
- **Spring Data JPA** with PostgreSQL
- **Spring WebSocket** for real-time communication
- **Maven** for dependency management

### DevOps
- **Docker** & **Docker Compose** for containerization
- **GitHub Actions** for CI/CD
- **Nginx** for frontend serving

## 📋 Prerequisites

- **Docker** and **Docker Compose** (recommended)
- **Java 17** (for local backend development)
- **Node.js 18+** (for local frontend development)
- **PostgreSQL 15** (if running without Docker)

## 🚀 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CodeArena
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

## 💻 Local Development Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Configure PostgreSQL**
   - Create database: `codearena`
   - Update `src/main/resources/application.yml` with your credentials

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

   Backend will start on http://localhost:8080

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will start on http://localhost:3000

## 🔑 Default Credentials

After first run, create an admin user:
1. Sign up through the UI
2. Manually update the user's role in the database:
   ```sql
   INSERT INTO user_roles (user_id, role) VALUES (1, 'ROLE_ADMIN');
   ```

## 📁 Project Structure

```
CodeArena/
├── backend/                 # Spring Boot application
│   ├── src/main/java/
│   │   └── com/codearena/
│   │       ├── config/      # Security, WebSocket configs
│   │       ├── controller/  # REST endpoints
│   │       ├── dto/         # Data transfer objects
│   │       ├── entity/      # JPA entities
│   │       ├── repository/  # Spring Data repositories
│   │       ├── security/    # JWT utilities
│   │       └── service/     # Business logic
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store
│   │   └── utils/           # Utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .github/workflows/       # CI/CD pipelines
```

## 🎨 UI Features

- **Glassmorphism Effects**: Modern frosted glass design
- **Gradient Themes**: Purple/indigo color scheme
- **Smooth Animations**: Fade-in, slide-up, hover effects
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Professional dark theme throughout
- **Custom Components**: Difficulty badges, status indicators

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Problems
- `GET /api/problems` - Get all problems
- `GET /api/problems/{id}` - Get problem by ID
- `POST /api/problems` - Create problem (Admin only)
- `PUT /api/problems/{id}` - Update problem (Admin only)
- `DELETE /api/problems/{id}` - Delete problem (Admin only)

### Submissions
- `POST /api/submissions` - Submit code
- `GET /api/submissions/user/{userId}` - Get user submissions
- `GET /api/submissions/{id}` - Get submission by ID

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/leaderboard` - Get leaderboard

### Admin
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/{id}` - Delete user
- `PUT /api/admin/users/{id}/role` - Update user role

## 🧪 Testing

### Backend Tests
```bash
cd backend
mvn test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose up --build backend
```

## 🔧 Environment Variables

### Backend (application.yml)
- `SPRING_DATASOURCE_URL` - PostgreSQL connection URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRATION` - Token expiration time

### Frontend (vite.config.js)
- API proxy configured to `http://localhost:8080`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Monaco Editor for the code editor
- Spring Boot for the backend framework
- React and Redux Toolkit for the frontend
- Tailwind CSS for styling utilities

---

**Built with ❤️ for competitive programmers**
