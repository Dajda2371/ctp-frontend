# User Management & Roles - API Documentation

## Status: Frontend Planning

### Frontend Roles implemented
- Roles defined as: `admin`, `property_manager`, `facility_manager`, `technician`, `cleaning`.

### Backend API Requirements

The following endpoints are required for the User Management feature:

#### 1. Fetch User List
- **Endpoint**: `GET /users`
- **Response**: Array of user objects including `id`, `email`, `role`, and `name`.

#### 2. Update User Role
- **Endpoint**: `PATCH /users/{id}/role`
- **Body**: `{ "role": "admin" | "property_manager" | ... }`
- **Response**: Updated user object.

#### 3. Current User Role
- **Endpoint**: `GET /auth/me` (or similar)
- **Response**: Should include `role` field in the user object to allow frontend permission checks.

### Role Permissions (Frontend View)
| Role | Access to User Management | Access to Site Management | Access to Tasks |
| :--- | :--- | :--- | :--- |
| Admin | Yes | Yes | Yes |
| Property Manager | No | Yes | Yes |
| Facility Manager | No | Yes | Yes |
| Technician | No | No | Yes |
| Cleaning | No | No | Yes |
