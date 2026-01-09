# User Management & Roles - API Documentation

## Status: Frontend Planning

### Frontend Roles implemented
- Roles defined as: `admin`, `property_manager`, `facility_manager`, `technician`, `cleaning`.

### Backend API Requirements

The following endpoints are required for the User Management feature:

#### 1. Fetch User List
- **Endpoint**: `GET /users`
- **Authentication**: Required (Bearer Token)
- **Response**: JSON array of user objects.

**Example Response:**
```json
[
  {
    "id": "uuid-string",
    "email": "user@ctp.eu",
    "name": "Jane Doe",
    "role": "admin"
  },
  {
    "id": "uuid-string-2",
    "email": "tech@ctp.eu",
    "name": "Bob Smith",
    "role": "technician"
  }
]
```

**Frontend Fetch Logic:**
The frontend will use the `fetch` API (or a wrapper) to call this endpoint. It will expect an array of objects that match the `UserRole` enum values defined in `constants/roles.ts`.

```typescript
// Example frontend fetch call
const response = await fetch(`${API_BASE_URL}/users`, {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    },
});
const data = await response.json();
// data should match the User interface
```

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
