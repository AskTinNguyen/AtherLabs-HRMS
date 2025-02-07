# HR Salary Management System

A comprehensive HR salary management application built with React, TypeScript, and Material-UI that provides detailed salary analytics, employee management, and data visualization capabilities.

## Features

- 📊 Interactive Salary Dashboard
- 👥 Employee Management
- 📈 Multiple Data Visualization Charts
- 🌓 Dark/Light Theme Support
- 💬 AI-Powered ChatBot Assistant
- 📱 Responsive Design
- 💾 Automatic Data Persistence

## Tech Stack

- **Frontend:**
  - TypeScript
  - Material-UI (MUI) v5
  - Recharts for data visualization
  - Day.js for date handling

- **Backend:**
  - Express.js
  - Node.js
  - TypeScript


## Project Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatBot.tsx
│   │   ├── ChatDialog.tsx
│   │   └── SettingsDialog.tsx
│   ├── DivisionSalaryChart.tsx
│   ├── SalaryChart.tsx
│   ├── SalaryDashboard.tsx
│   ├── SalaryMonthlyChart.tsx
│   ├── SalaryRangeChart.tsx
│   ├── SalaryTable.tsx
│   ├── SubDepartmentSalaryChart.tsx
│   └── TerminationImpactChart.tsx
├── server/
│   ├── api.ts
│   └── index.ts
├── services/
│   ├── ai.ts
│   └── salaryService.ts
├── types/
│   └── salary.ts
├── App.tsx
└── index.tsx
```

## Component Overview

### Main Components

1. **SalaryDashboard (`SalaryDashboard.tsx`)**
   - Main dashboard component displaying key metrics
   - Includes total monthly salary, projected salary, and yearly calculations
   - Houses multiple visualization tabs

2. **SalaryTable (`SalaryTable.tsx`)**
   - Interactive employee data grid
   - CRUD operations for employee management
   - Sorting, filtering, and pagination capabilities

3. **ChatBot (`chat/ChatBot.tsx`)**
   - AI-powered assistant for HR queries
   - Integrated with Google's Generative AI
   - Custom chat interface

### Visualization Components

1. **SalaryChart (`SalaryChart.tsx`)**
   - Bar chart showing salary distribution across departments
   - Displays min, max, and average salaries

2. **DivisionSalaryChart (`DivisionSalaryChart.tsx`)**
   - Pie chart visualization of salary distribution by division
   - Interactive tooltips with detailed information

3. **SalaryMonthlyChart (`SalaryMonthlyChart.tsx`)**
   - Tracks monthly salary trends
   - Historical salary data visualization

4. **SubDepartmentSalaryChart (`SubDepartmentSalaryChart.tsx`)**
   - Scatter plot of sub-department salary distributions
   - Employee count and average salary analysis

5. **TerminationImpactChart (`TerminationImpactChart.tsx`)**
   - Analyzes impact of employee terminations
   - Forecasts salary changes

## Setup and Installation

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm or yarn

2. **Installation**
   ```bash
   # Clone the repository
   git clone [repository-url]

   # Install dependencies
   npm install

   # Setup data file
   cp src/salary.example.json src/salary.json
   # Edit src/salary.json with your actual salary data

   # Setup environment variables
   cp .env.example .env
   # Edit .env with your actual configuration
   ```

3. **Running the Application**
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

Create a `.env` file in the root directory by copying `.env.example` and updating the values:
```
PORT=3001
GOOGLE_API_KEY=your_google_api_key  # Required for ChatBot functionality
```

## Data Configuration

The application requires a `salary.json` file in the `src` directory to function. For security reasons, this file is not included in the repository.

1. Copy the example file:
   ```bash
   cp src/salary.example.json src/salary.json
   ```

2. Update `src/salary.json` with your actual salary data following the same structure as the example file.

3. Make sure not to commit your actual salary data to the repository.

### Switching Between Real and Example Data

The repository includes a script to easily switch between real and example salary data. This is useful when:
- You want to test the application with example data
- You're preparing to commit changes (switch to example data)
- You're ready to resume work with real data

To use the script:

1. Switch to example data (automatically backs up your real data):
   ```bash
   ./scripts/switch-data.sh example
   ```

2. Switch back to real data:
   ```bash
   ./scripts/switch-data.sh real
   ```

The script will:
- Safely backup your real data when switching to example data
- Preserve both real and example data sets
- Prevent accidental data loss
- Make it safer to commit changes

> **Note**: Always switch to example data before committing changes to ensure no sensitive data is accidentally committed.

## Features in Detail

### 1. Salary Dashboard
- Real-time salary metrics
- Department-wise breakdown
- Yearly projections
- Tax calculations (22% rate)

### 2. Employee Management
- Add/Edit/Delete employees
- Bulk operations support
- Data validation
- Automatic persistence

### 3. Data Visualization
- Multiple chart types
- Interactive tooltips
- Responsive layouts
- Custom color themes

### 4. Theme Support
- Light/Dark mode
- System preference detection
- Custom color palette
- Consistent styling

## API Endpoints

The backend server provides the following API endpoints:

- `GET /api/employees` - Retrieve all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed to Ather Labs.