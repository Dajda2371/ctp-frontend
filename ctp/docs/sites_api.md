# Backend API & Database Usage - Sites & Tasks

## Database Schema Recommendations

Based on the frontend requirements, here is the recommended schema structure:

### Table: `sites`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | PK | Unique identifier for the site. |
| `name` | String | NOT NULL | Name of the site (e.g., "CTPark Prague"). |
| `address` | String | NOT NULL | Physical address. |
| `coordinator` | String | | Name of the site coordinator (could be a FK to `users` table eventually). |

### Table: `tasks`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | PK | Unique task identifier. |
| `site_id` | UUID / String | FK -> sites.id | The site this task belongs to. |
| `title` | String | NOT NULL | Short title of the task. |
| `description` | Text | | Detailed description. |
| `status` | Enum / String | | `TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`. |
| `priority` | Enum / String | | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `assignee` | String | | Name of assignee (should be FK to `users.id`). |
| `created_at` | Timestamp | | Date of creation. |
| `photos` | JSON / Array | | List of image URLs (strings). |

## API Endpoints Required

### Sites
- `GET /sites` - List all sites.
- `GET /sites/{id}` - Get details for a specific site.
- `POST /sites` - Create a new site.

### Tasks
- `GET /tasks` - List all tasks (support filtering by `site_id`, `status`).
- `GET /tasks/{id}` - Get task details.
- `POST /tasks` - Create a new task.
