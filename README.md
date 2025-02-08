# HR Management System (HRMS)

A comprehensive HR management system built with React, TypeScript, and Material-UI that provides detailed salary analytics, employee management, recruitment tracking, and AI-powered insights.

## Features

- 📊 Interactive Dashboards
  - Salary Analytics
  - Recruitment Metrics
  - Organizational Structure Analysis
  - Custom Dashboard Views
- 👥 Employee & User Management
- 📈 Multiple Data Visualization Charts
- 🎯 Complete Recruitment Pipeline
  - Position Management
  - New Hires Tracking
  - Onboarding Process
- 🔐 Role-based Authentication
- 🌓 Dark/Light Theme Support
- 💬 AI-Powered ChatBot Assistant
- 📱 Responsive Design
- 💾 Automatic Data Persistence
- 🎮 Demo Mode for Testing

## Tech Stack

- **Frontend:**
  - TypeScript
  - React
  - Material-UI (MUI) v5
  - TailwindCSS
  - Recharts for data visualization
  - Day.js for date handling

- **Backend:**
  - Express.js
  - Node.js
  - TypeScript
  - Supabase (Database & Authentication)

## Project Structure

```
src/
├── components/
│   ├── admin/
│   │   └── UserManagement.tsx
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── chat/
│   │   ├── ChatBot.tsx
│   │   ├── ChatDialog.tsx
│   │   ├── ChatMessageItem.tsx
│   │   ├── FloatingAIButton.tsx
│   │   ├── SettingsDialog.tsx
│   │   └── types.ts
│   ├── common/
│   │   ├── DemoModeToggle.tsx
│   │   └── Sidebar.tsx
│   ├── dashboard/
│   │   ├── AIDashboard.tsx
│   │   ├── CustomDashboardView.tsx
│   │   └── OrganizationalStructureAnalysis.tsx
│   ├── recruitment/
│   │   ├── NewHiresTable.tsx
│   │   ├── OnboardingBoard.tsx
│   │   ├── PositionsTable.tsx
│   │   ├── RecruitmentDashboard.tsx
│   │   └── RecruitmentMetrics.tsx
│   ├── settings/
│   │   └── Settings.tsx
│   └── salary/
│       ├── DivisionSalaryChart.tsx
│       ├── SalaryChart.tsx
│       ├── SalaryDashboard.tsx
│       ├── SalaryMonthlyChart.tsx
│       ├── SalaryRangeChart.tsx
│       ├── SalaryTable.tsx
│       ├── SubDepartmentSalaryChart.tsx
│       └── TerminationImpactChart.tsx
├── context/
│   └── DemoModeContext.tsx
├── lib/
│   ├── auth.ts
│   └── supabase.ts
├── server/
│   ├── api.ts
│   └── index.ts
├── services/
│   ├── ai.ts
│   ├── dashboardService.ts
│   ├── employeeService.ts
│   ├── recruitmentService.ts
│   └── salaryService.ts
├── types/
│   ├── dashboard.ts
│   ├── recruitment.ts
│   ├── salary.ts
│   ├── supabase.ts
│   └── uuid.d.ts
├── utils/
│   └── demoDataTransform.ts
├── App.tsx
└── index.tsx
```

## Component Overview

### Core Features

1. **Authentication (`auth/LoginPage.tsx`)**
   - Secure login/logout functionality
   - Role-based access control
   - Integration with Supabase auth

2. **User Management (`admin/UserManagement.tsx`)**
   - User role management
   - Access control
   - User profile management

3. **Salary Dashboard (`salary/SalaryDashboard.tsx`)**
   - Key salary metrics
   - Department-wise breakdown
   - Yearly projections
   - Tax calculations

4. **Recruitment System**
   - Position tracking (`recruitment/PositionsTable.tsx`)
   - New hire management (`recruitment/NewHiresTable.tsx`)
   - Onboarding workflow (`recruitment/OnboardingBoard.tsx`)
   - Recruitment metrics (`recruitment/RecruitmentMetrics.tsx`)

5. **AI Dashboard (`dashboard/AIDashboard.tsx`)**
   - AI-powered insights
   - Custom dashboard views
   - Organizational analysis

6. **ChatBot System**
   - AI-powered assistant (`chat/ChatBot.tsx`)
   - Floating chat interface (`chat/FloatingAIButton.tsx`)
   - Message history (`chat/ChatMessageItem.tsx`)

### Settings & Configuration

1. **Settings Management (`settings/Settings.tsx`)**
   - Application configuration
   - User preferences
   - System settings

2. **Demo Mode (`common/DemoModeToggle.tsx`)**
   - Toggle between demo and production data
   - Safe testing environment

## AI Features

1. **AI Dashboard Generation**
   - Automatic insights generation
   - Custom dashboard recommendations
   - Organizational structure analysis
   - Performance metrics visualization

2. **AI-Powered Chat Assistant**
   - Natural language query processing
   - HR policy assistance
   - Employee data analysis
   - Recruitment recommendations

3. **AI Data Filtering**
   - Smart data categorization
   - Automated report generation
   - Pattern recognition
   - Anomaly detection

## Setup and Installation

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm or yarn
   - Supabase CLI

2. **Installation**
   ```bash
   # Clone the repository
   git clone [repository-url]

   # Install dependencies
   npm install

   # Setup environment variables
   cp .env.example .env
   # Edit .env with your actual configuration

   # Setup Supabase
   supabase init
   supabase start
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   cd supabase
   supabase db push

   # Seed demo data (optional)
   npm run seed:demo
   ```

4. **Running the Application**
   ```bash
   # Start both frontend and backend in development mode
   npm run dev

   # Start frontend only
   npm start

   # Start backend only
   npm run server
   ```

   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Environment Configuration

Create a `.env` file in the root directory with:
```
PORT=3001
GOOGLE_API_KEY=your_google_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Setup (Supabase)

1. Create a Supabase project
2. Run migrations:
   ```bash
   cd supabase
   supabase db push
   ```
3. Initial migrations are in:
   - `supabase/migrations/20240207_initial_schema.sql`
   - `supabase/migrations/20240208_user_roles.sql`

## Testing

The project includes comprehensive test coverage:

- Unit tests for services and components
- Integration tests for dashboard generation
- AI filtering tests
- Test documentation available in `services/__tests__/docs/`

Run tests with:
```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## API Endpoints

The backend server provides the following API endpoints:

- `GET /api/employees` - Retrieve all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Recruitment
- `GET /api/recruitment/positions` - List positions
- `POST /api/recruitment/positions` - Create position
- `GET /api/recruitment/metrics` - Get recruitment metrics
- `GET /api/recruitment/onboarding/:id` - Get onboarding status

### Dashboard
- `GET /api/dashboard/custom` - Get custom dashboard
- `POST /api/dashboard/generate` - Generate AI dashboard
- `GET /api/dashboard/org-structure` - Get org structure

## Deployment

The application is configured for deployment on Vercel:

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy using the `vercel.json` configuration

## Scripts

- `scripts/check-sensitive-files.cjs` - Prevent committing sensitive data
- `scripts/migrate-to-supabase.ts` - Database migration utility
- `scripts/setup-hooks.sh` - Set up git hooks
- `scripts/switch-data.sh` - Switch between real and demo data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed to Ather Labs.

## ⚠️ Important: Handling Sensitive Data

This repository is configured to prevent accidental commits of sensitive data:

- Never commit real salary or HR data
- Use example files for development
- Run `./scripts/switch-data.sh example` before committing
- Check `.gitignore` and `scripts/check-sensitive-files.cjs` for protected patterns

### Setting Up Development Data

1. Copy the example file:
   ```bash
   cp src/salary.example.json src/salary.json
   ```

2. Update with your development data following the same structure

3. Never commit the actual salary.json file

## Testing Architecture

The project follows a comprehensive testing strategy:

### Test Structure
```
services/__tests__/
├── docs/
│   ├── AI_DASHBOARD_FEATURE.md
│   ├── FILTERING_TESTS.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── MOCK_IMPLEMENTATIONS.md
│   └── TEST_ARCHITECTURE.md
├── integration/
│   └── dashboard-generation.test.tsx
├── ai-filtering.test.ts
├── ai.test.ts
└── dashboard.test.ts
```

### Test Categories

1. **Unit Tests**
   - Component rendering and behavior
   - Service function logic
   - Utility function validation
   - Type checking and validation

2. **Integration Tests**
   - Dashboard generation workflow
   - Authentication flow
   - API endpoint integration
   - Database operations

3. **AI Feature Tests**
   - Chat response accuracy
   - Dashboard insight generation
   - Data filtering precision
   - Pattern recognition reliability

### Test Documentation

Detailed test documentation is available in the `services/__tests__/docs/` directory:
- `AI_DASHBOARD_FEATURE.md` - AI dashboard generation testing
- `FILTERING_TESTS.md` - Data filtering test cases
- `IMPLEMENTATION_SUMMARY.md` - Overall test implementation guide
- `MOCK_IMPLEMENTATIONS.md` - Mock data and service setup
- `TEST_ARCHITECTURE.md` - Test structure and best practices