One of the simplest ways to implement a basic HR system—from recruitment planning through onboarding and conversion—built entirely from scratch. This “minimal viable system” focuses only on the core workflow and data models, and you can expand it later as needed.

1. Overall Approach
Framework Choice:
Use a lightweight web framework (for example, Flask for Python, Express for Node.js, or even a minimal Django setup) to quickly spin up RESTful API endpoints.

Database:
Start with a simple relational database (SQLite is a good choice during development) to store positions, new hire data, and employee records.

Frontend:
Build minimal HTML forms (or use a simple frontend framework) that communicate with your backend via RESTful endpoints. You might also use basic client‑side JavaScript for real‑time calculations (e.g., budget impact).

2. Data Model
Define three core entities:

Positions Table:

Fields:
id (primary key)
title
department_id (foreign key or a simple string for now)
base_salary
budget_impact (calculated value based on salary and department rules)
status (values: "open", "in-progress", "filled")
approval_status (e.g., "pending", "approved", "rejected")
created_at / updated_at
NewHires Table:

Fields:
id (primary key)
candidate_name
position_id (foreign key to Positions)
onboarding_status (values: "pending", "in-progress", "completed")
start_date
probation_end_date
Employees Table:

Fields:
id (primary key)
name
position_id (foreign key to Positions)
salary
hire_date
This simple schema covers the core information needed to track a position through its lifecycle—from an open request, through candidate selection and onboarding, to final conversion into a full‑time employee.

3. Backend Implementation
A. API Endpoints
Create minimal REST endpoints for each workflow stage:

Recruitment Planning:

POST /positions
Create a new position request. Initialize with status "open" and calculate the initial budget impact.
PUT /positions/{id}/status
Update the position status (e.g., change from "open" to "in-progress" when recruitment starts).
Hiring Manager Approvals:

PUT /positions/{id}/approval
Update the approval_status based on manager actions.
New Hire Onboarding:

POST /newhires
Create a new hire record linked to a specific position (position_id) when a candidate is selected.
PUT /newhires/{id}/onboarding
Update the onboarding status as tasks are completed.
Conversion to Full-Time Employee:

POST /newhires/{id}/convert
When onboarding is marked "completed" and the probation period has ended, convert the NewHire record into an Employee record. In this step, update the related position’s status to "filled" and push salary details to the employee record.
B. Business Logic
Implement a simple state machine in code:

Position Status Flow:
"open" → "in-progress" → "filled"
Onboarding Flow:
"pending" → "in-progress" → "completed"
Add simple conditions (or even a flag) to verify that the onboarding stage is complete and that any required approvals are in place before allowing conversion.

4. Frontend Implementation
Basic Forms:
Create HTML forms for:

Creating new positions (with real‑time JavaScript to compute budget impact based on entered salary and department parameters).
Updating the recruitment status and approvals.
Entering candidate information and tracking onboarding progress.
Triggering the conversion process (this could be a button that calls the conversion endpoint).
Minimal UI:
A simple dashboard that lists open positions, shows their status, and provides links to update or approve changes. You can add more polish as needed later.

5. Simplest Integration Steps
Set Up Project:

Initialize your project (for example, create a new Flask or Express project).
Configure your SQLite database and set up the tables according to the data model.
Develop API Endpoints:

Implement endpoints one by one and test using tools like Postman or cURL.
Build Frontend:

Develop basic forms and dashboards that interact with your API endpoints.
Use JavaScript to add dynamic elements (like budget impact calculation).
Testing:

Write simple unit tests for your business logic (status transitions, conversion criteria).
Manually test the entire workflow from position creation to employee conversion.
Deploy Locally:

Once satisfied with the local implementation, consider deploying to a local server for further testing.
6. Conclusion
This simplest implementation focuses on the core entities and workflow transitions required for recruitment-to-full-time conversion. By building a minimal REST API, a basic database schema, and simple HTML forms, you’ll have a functioning prototype that can be iterated upon. This approach lets you add complexity gradually—such as detailed approvals, notifications, and analytics—while keeping the initial build manageable and focused on essential functionality.