<p align="center">
  <img src="Client/public/favicon/android-chrome-512x512.png" alt="YamiFit Logo" width="120" height="120">
</p>

<h1 align="center">🏋️ YamiFit</h1>

<p align="center">
  <strong>Your Personal Wellness Journey</strong>
</p>

<p align="center">
  A comprehensive health and fitness platform that connects users with coaches, meal providers, and powerful tracking tools to achieve their wellness goals.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#api-documentation">API</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

---

## 📖 Overview

**YamiFit** is a full-stack wellness application designed to help users take control of their health journey. Whether you're looking to lose weight, gain muscle, or maintain a healthy lifestyle, YamiFit provides the tools and support you need.

The platform features a multi-role system supporting:
- **Users** - Track nutrition, connect with coaches, and order healthy meals
- **Coaches** - Manage clients, create diet plans, and schedule appointments
- **Meal Providers** - List meals, manage orders, and grow your health food business
- **Admins** - Oversee the entire platform with comprehensive management tools

---

## ✨ Features

### 🍽️ Nutrition & Meal Tracking
- **Daily Intake Tracking** - Log calories, macros, and water intake
- **Meal Ordering** - Browse and order from verified meal providers
- **Custom Meal Plans** - Receive personalized nutrition plans from coaches
- **Progress Visualization** - Beautiful charts powered by Recharts

### 🏃 Fitness & Health
- **Health Profile Assessment** - Comprehensive health questionnaire
- **Goal Setting** - Choose from weight loss, muscle gain, or maintenance
- **Activity Level Tracking** - Adjust plans based on your lifestyle
- **BMI & Calorie Calculations** - Automatic calculations based on your profile

### 👨‍🏫 Coaching System
- **1-on-1 Coaching** - Connect with certified health coaches
- **Real-time Chat** - Communicate with your coach instantly
- **Appointment Scheduling** - Book sessions with your coach
- **Progress Monitoring** - Coaches can track client progress

### 🤖 AI-Powered Features
- **Intelligent Chatbot** - Get instant answers powered by Google Gemini AI
- **Personalized Recommendations** - AI-driven meal and activity suggestions

### 🌍 Internationalization
- **Multi-language Support** - Full support for English and Arabic
- **RTL Layout** - Proper right-to-left support for Arabic users
- **Bilingual Content** - Meals and content available in both languages

### 🎨 User Experience
- **Dark/Light Theme** - Beautiful themes with seamless switching
- **Mobile Responsive** - Optimized for all device sizes
- **Real-time Notifications** - Stay updated on orders and appointments
- **Smooth Animations** - Polished UI with Tailwind CSS animations

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Vite** | Build Tool & Dev Server |
| **Redux Toolkit** | State Management |
| **TanStack Query** | Server State & Caching |
| **React Router v6** | Client-side Routing |
| **Tailwind CSS** | Styling & Design System |
| **Radix UI** | Accessible UI Components |
| **React Hook Form** | Form Management |
| **Zod** | Schema Validation |
| **i18next** | Internationalization |
| **Recharts** | Data Visualization |
| **Lucide React** | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime Environment |
| **Express.js** | Web Framework |
| **Supabase** | Database & Authentication |
| **Google Gemini AI** | AI Chatbot |
| **Helmet** | Security Middleware |
| **Express Rate Limit** | API Rate Limiting |

### Database
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary Database (via Supabase) |
| **Row Level Security** | Data Protection |
| **Realtime Subscriptions** | Live Updates |

---

## 📦 Installation

### Prerequisites

Ensure you have the following installed:
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- **Git**

### Clone the Repository

```bash
git clone https://github.com/yourusername/yamifit.git
cd yamifit
```

### Environment Setup

#### Client Environment

Create a `.env` file in the `Client` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

#### Server Environment

Create a `.env` file in the `Server` directory:

```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_AI_API_KEY=your_google_gemini_api_key
NODE_ENV=development
```

### Install Dependencies

```bash
# Install client dependencies
cd Client
npm install

# Install server dependencies
cd ../Server
npm install
```

### Database Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Navigate to the SQL Editor in your Supabase dashboard
3. Execute the `Server/schema.sql` file to create all tables and policies
4. Run migrations from `Server/migrations/` in order (001, 002, etc.)

---

## 🚀 Usage

### Development Mode

Start both the client and server in development mode:

```bash
# Terminal 1 - Start the backend server
cd Server
npm run dev

# Terminal 2 - Start the frontend
cd Client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Production Build

```bash
# Build the frontend
cd Client
npm run build

# Start the production server
cd ../Server
npm start
```

### Available Scripts

#### Client Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run build:dev` | Create development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Deploy to GitHub Pages |

#### Server Scripts
| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (hot reload) |

---

## 📁 Project Structure

```
YamiFit/
├── Client/                      # React Frontend Application
│   ├── public/                  # Static assets
│   │   └── favicon/             # App icons
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── Charts/          # Data visualization
│   │   │   ├── Chatbot/         # AI chatbot interface
│   │   │   ├── Coaching/        # Coaching features
│   │   │   ├── landing/         # Landing page components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── Meals/           # Meal-related components
│   │   │   ├── Orders/          # Order management
│   │   │   ├── pages/           # Page components
│   │   │   ├── provider/        # Meal provider components
│   │   │   ├── Settings/        # Settings components
│   │   │   ├── shared/          # Shared/reusable components
│   │   │   ├── Subscription/    # Subscription features
│   │   │   ├── Tracker/         # Tracking components
│   │   │   └── ui/              # UI primitives (Radix-based)
│   │   ├── config/              # App configuration
│   │   ├── context/             # React contexts
│   │   ├── data/                # Static data & mock data
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility libraries
│   │   ├── locales/             # i18n translation files
│   │   ├── pages/               # Route pages
│   │   ├── services/            # API services
│   │   ├── store/               # Redux store & slices
│   │   └── utils/               # Helper functions
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── Server/                      # Express Backend API
│   ├── middleware/              # Express middleware
│   ├── migrations/              # Database migrations
│   ├── routes/                  # API routes
│   ├── services/                # Business logic
│   ├── supabase/
│   │   └── functions/           # Supabase Edge Functions
│   ├── index.js                 # Server entry point
│   ├── schema.sql               # Database schema
│   └── package.json
│
└── README.md
```

---

## 🔌 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Health Check
```http
GET /health
```
Returns server status and timestamp.

#### Chat API
```http
POST /api/chat/message
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "string",
  "conversationId": "string (optional)"
}
```
Send a message to the AI chatbot.

### Rate Limiting
- **30 requests per minute** per IP address for all `/api/*` endpoints

### Security Headers
All responses include security headers via Helmet:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Content-Security-Policy

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with roles and plans |
| `health_profiles` | User health data and goals |
| `meal_providers` | Registered meal provider businesses |
| `meals` | Available meals with nutrition info |
| `orders` | Meal orders and status |
| `coach_profiles` | Coach information and specialties |
| `coach_client_relationships` | Coach-client connections |
| `appointments` | Scheduled coaching sessions |
| `chat_messages` | Real-time chat messages |
| `chatbot_messages` | AI chatbot conversation history |
| `daily_tracking` | Daily nutrition and activity logs |
| `subscription_plans` | Available subscription tiers |
| `user_subscriptions` | User subscription records |

### User Roles
- `user` - Standard platform user
- `coach` - Certified health coach
- `meal_provider` - Food service provider
- `admin` - Platform administrator

---

## 🔐 Authentication

YamiFit uses **Supabase Auth** for secure authentication:

- **Email/Password** - Traditional sign-up and login
- **Password Reset** - Secure password recovery flow
- **Session Management** - Automatic token refresh
- **Row Level Security** - Database-level access control

---

## 🌐 Internationalization

The app supports multiple languages using **i18next**:

### Supported Languages
- 🇺🇸 English (en)
- 🇸🇦 Arabic (ar) - with full RTL support

### Adding New Languages
1. Create translation file in `Client/src/locales/`
2. Add language config in `Client/src/lib/i18n.js`
3. Update language selector component

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](Client/LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Codescandy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 📞 Support

- **Website**: [https://yamifit.com](https://yamifit.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/yamifit/issues)
- **Email**: support@yamifit.com

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Lucide](https://lucide.dev) - Beautiful icons
- [Google Gemini](https://ai.google.dev/) - AI capabilities

---

<p align="center">
  Made with ❤️ by the YamiFit Team
</p>

<p align="center">
  <a href="#-yamifit">Back to Top ⬆️</a>
</p>
