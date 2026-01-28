# REST API Plan

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Flashcards | `flashcards` | Educational flashcards with SM-2 spaced repetition parameters |
| Generation Logs | `generation_logs` | Analytics logs for AI flashcard generation sessions |
| Auth | `auth.users` (Supabase) | User authentication and account management |

## 2. Endpoints

### 2.1. Authentication Endpoints

Authentication is handled primarily through Supabase Auth SDK on the client side. The following endpoints document the expected API interactions.

#### POST /api/auth/register

Register a new user account.

- **Description**: Creates a new user account using email and password
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1705312200
  }
}
```
- **Errors**:
  - `400 Bad Request`: Invalid email format or weak password
  - `409 Conflict`: Email already registered

#### POST /api/auth/login

Authenticate an existing user.

- **Description**: Logs in a user with email and password
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1705312200
  }
}
```
- **Errors**:
  - `400 Bad Request`: Missing required fields
  - `401 Unauthorized`: Invalid credentials

#### POST /api/auth/logout

Log out the current user.

- **Description**: Invalidates the current session
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (200 OK):
```json
{
  "message": "Successfully logged out"
}
```
- **Errors**:
  - `401 Unauthorized`: No valid session

#### DELETE /api/auth/account

Delete user account and all associated data.

- **Description**: Permanently deletes the user account and all flashcards (CASCADE DELETE)
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (200 OK):
```json
{
  "message": "Account successfully deleted"
}
```
- **Errors**:
  - `401 Unauthorized`: Not authenticated

---

### 2.2. Flashcards Endpoints

#### GET /api/flashcards

Retrieve a paginated list of user's flashcards.

- **Description**: Returns all flashcards belonging to the authenticated user with pagination and optional search
- **Headers**: `Authorization: Bearer <access_token>`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |-----------|------|----------|---------|-------------|
  | `page` | integer | No | 1 | Page number (1-indexed) |
  | `limit` | integer | No | 20 | Items per page (max 100) |
  | `search` | string | No | - | Search query for front/back content |
  | `sort` | string | No | `created_at` | Sort field: `created_at`, `updated_at`, `next_review_date` |
  | `order` | string | No | `desc` | Sort order: `asc`, `desc` |

- **Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is spaced repetition?",
      "back": "A learning technique that incorporates increasing intervals of time between subsequent review of previously learned material.",
      "is_ai_generated": true,
      "interval": 4,
      "ease_factor": 2.5,
      "repetitions": 3,
      "next_review_date": "2024-01-20",
      "last_reviewed_at": "2024-01-16T14:30:00Z",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-16T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```
- **Errors**:
  - `401 Unauthorized`: Not authenticated
  - `400 Bad Request`: Invalid query parameters

#### GET /api/flashcards/:id

Retrieve a single flashcard by ID.

- **Description**: Returns a specific flashcard if it belongs to the authenticated user
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (200 OK):
```json
{
  "id": "uuid",
  "front": "What is spaced repetition?",
  "back": "A learning technique...",
  "original_front": "What is spaced repetition?",
  "original_back": "A learning technique...",
  "is_ai_generated": true,
  "generation_log_id": "uuid",
  "interval": 4,
  "ease_factor": 2.5,
  "repetitions": 3,
  "next_review_date": "2024-01-20",
  "last_reviewed_at": "2024-01-16T14:30:00Z",
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-16T14:30:00Z"
}
```
- **Errors**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found or doesn't belong to user

#### POST /api/flashcards

Create a new flashcard manually.

- **Description**: Creates a single flashcard with `is_ai_generated = false`
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "front": "What is the capital of France?",
  "back": "Paris"
}
```
- **Response** (201 Created):
```json
{
  "id": "uuid",
  "front": "What is the capital of France?",
  "back": "Paris",
  "is_ai_generated": false,
  "interval": 0,
  "ease_factor": 2.5,
  "repetitions": 0,
  "next_review_date": "2024-01-15",
  "last_reviewed_at": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```
- **Validation**:
  - `front`: Required, non-empty after trimming
  - `back`: Required, non-empty after trimming
- **Errors**:
  - `400 Bad Request`: Validation failed (empty front or back)
  - `401 Unauthorized`: Not authenticated

#### POST /api/flashcards/batch

Create multiple flashcards from AI generation staging area.

- **Description**: Bulk creates flashcards from accepted AI proposals, updates generation log with statistics
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "generation_log_id": "uuid",
  "flashcards": [
    {
      "front": "What is SM-2?",
      "back": "A spaced repetition algorithm...",
      "original_front": "What is SM-2?",
      "original_back": "A spaced repetition algorithm...",
      "is_edited": false
    },
    {
      "front": "What is the forgetting curve?",
      "back": "A hypothesis that describes...",
      "original_front": "What is the forgeting curve?",
      "original_back": "A hypothesis describing...",
      "is_edited": true
    }
  ],
  "rejected_count": 2
}
```
- **Response** (201 Created):
```json
{
  "created_count": 2,
  "flashcards": [
    {
      "id": "uuid",
      "front": "What is SM-2?",
      "back": "A spaced repetition algorithm...",
      "is_ai_generated": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "front": "What is the forgetting curve?",
      "back": "A hypothesis that describes...",
      "is_ai_generated": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```
- **Validation**:
  - Each flashcard must have non-empty `front` and `back`
  - `generation_log_id` must exist and belong to user
- **Errors**:
  - `400 Bad Request`: Validation failed
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Generation log not found

#### PUT /api/flashcards/:id

Update an existing flashcard.

- **Description**: Updates the front and/or back content of a flashcard
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "front": "Updated question?",
  "back": "Updated answer"
}
```
- **Response** (200 OK):
```json
{
  "id": "uuid",
  "front": "Updated question?",
  "back": "Updated answer",
  "is_ai_generated": true,
  "updated_at": "2024-01-15T11:00:00Z"
}
```
- **Validation**:
  - `front`: If provided, must be non-empty after trimming
  - `back`: If provided, must be non-empty after trimming
- **Errors**:
  - `400 Bad Request`: Validation failed
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found

#### DELETE /api/flashcards/:id

Delete a flashcard.

- **Description**: Permanently removes a flashcard
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (200 OK):
```json
{
  "message": "Flashcard successfully deleted"
}
```
- **Errors**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found

#### POST /api/flashcards/:id/reset-progress

Reset learning progress for a flashcard.

- **Description**: Resets SM-2 parameters to initial values
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (200 OK):
```json
{
  "id": "uuid",
  "interval": 0,
  "ease_factor": 2.5,
  "repetitions": 0,
  "next_review_date": "2024-01-15",
  "last_reviewed_at": null,
  "message": "Learning progress reset successfully"
}
```
- **Errors**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found

---

### 2.3. Study Session Endpoints

#### GET /api/study/session

Get flashcards for a study session.

- **Description**: Returns flashcards due for review, limited to 20 new cards plus all due reviews
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (200 OK):
```json
{
  "cards": [
    {
      "id": "uuid",
      "front": "What is spaced repetition?",
      "back": "A learning technique...",
      "is_new": false
    }
  ],
  "statistics": {
    "total_cards": 25,
    "new_cards": 10,
    "review_cards": 15
  }
}
```
- **Business Logic**:
  - New cards: `last_reviewed_at IS NULL` (limited to 20)
  - Review cards: `next_review_date <= CURRENT_DATE` (no limit)
  - Cards are ordered: reviews first, then new cards
- **Errors**:
  - `401 Unauthorized`: Not authenticated

#### POST /api/study/review

Submit a review for a flashcard.

- **Description**: Records user's answer and updates SM-2 parameters
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "flashcard_id": "uuid",
  "remembered": true
}
```
- **Response** (200 OK):
```json
{
  "flashcard_id": "uuid",
  "interval": 6,
  "ease_factor": 2.6,
  "repetitions": 4,
  "next_review_date": "2024-01-21",
  "last_reviewed_at": "2024-01-15T14:30:00Z"
}
```
- **SM-2 Algorithm Logic**:
  - If `remembered = true` (quality >= 3 in SM-2 terms):
    - If `repetitions = 0`: `interval = 1`
    - If `repetitions = 1`: `interval = 6`
    - Else: `interval = interval * ease_factor`
    - `repetitions += 1`
    - `ease_factor = ease_factor + 0.1` (capped at 2.5 min for binary)
  - If `remembered = false` (quality < 3):
    - `repetitions = 0`
    - `interval = 1`
    - `ease_factor = max(1.3, ease_factor - 0.2)`
  - `next_review_date = CURRENT_DATE + interval`
  - `last_reviewed_at = NOW()`
- **Errors**:
  - `400 Bad Request`: Invalid flashcard_id or missing remembered field
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found

---

### 2.4. AI Generation Endpoints

#### POST /api/generations

Generate flashcard proposals from text using AI.

- **Description**: Sends text to AI model (via Openrouter.ai) and returns generated flashcard proposals
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "source_text": "Long text content between 1000-10000 characters..."
}
```
- **Response** (200 OK):
```json
{
  "generation_log_id": "uuid",
  "proposals": [
    {
      "front": "Generated question 1?",
      "back": "Generated answer 1"
    },
    {
      "front": "Generated question 2?",
      "back": "Generated answer 2"
    }
  ],
  "model_used": "gpt-4o-mini",
  "generated_count": 5
}
```
- **Validation**:
  - `source_text`: Required, length must be between 1000 and 10000 characters
- **Business Logic**:
  - Creates a `generation_logs` entry before calling AI
  - Communicates with Openrouter.ai API
  - Updates `generated_count` in generation log
- **Errors**:
  - `400 Bad Request`: Text too short (< 1000 chars) or too long (> 10000 chars)
  - `401 Unauthorized`: Not authenticated
  - `502 Bad Gateway`: AI service unavailable
  - `503 Service Unavailable`: AI rate limit exceeded

#### GET /api/generations

Get generation logs for the authenticated user.

- **Description**: Returns paginated list of generation history for analytics
- **Headers**: `Authorization: Bearer <access_token>`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |-----------|------|----------|---------|-------------|
  | `page` | integer | No | 1 | Page number |
  | `limit` | integer | No | 20 | Items per page (max 100) |

- **Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "source_text_length": 5000,
      "generated_count": 10,
      "accepted_unedited_count": 7,
      "accepted_edited_count": 2,
      "rejected_count": 1,
      "model_used": "gpt-4o-mini",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```
- **Errors**:
  - `401 Unauthorized`: Not authenticated

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

The API uses **Supabase Auth** with JWT (JSON Web Tokens) for authentication.

**Implementation Details**:
- Users authenticate via email/password through Supabase Auth
- Upon successful authentication, Supabase issues an `access_token` (JWT) and `refresh_token`
- The `access_token` must be included in all API requests via the `Authorization` header
- Token format: `Authorization: Bearer <access_token>`
- Tokens expire after a configurable period (default: 1 hour)
- Refresh tokens are used to obtain new access tokens without re-authentication

### 3.2. Authorization via Row Level Security (RLS)

All data access is controlled by PostgreSQL Row Level Security policies:

| Table | Policy | Rule |
|-------|--------|------|
| `flashcards` | SELECT | `auth.uid() = user_id` |
| `flashcards` | INSERT | `auth.uid() = user_id` |
| `flashcards` | UPDATE | `auth.uid() = user_id` |
| `flashcards` | DELETE | `auth.uid() = user_id` |
| `generation_logs` | SELECT | `auth.uid() = user_id` |
| `generation_logs` | INSERT | `auth.uid() = user_id` |

**Security Guarantees**:
- Users can only access their own flashcards
- Users can only access their own generation logs
- Deletion of a user account cascades to delete all associated data
- No cross-user data access is possible at the database level

### 3.3. API Security Headers

All API responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
```

---

## 4. Validation and Business Logic

### 4.1. Flashcards Validation

| Field | Validation Rule | Error Message |
|-------|-----------------|---------------|
| `front` | Required, non-empty after trim | "Front side cannot be empty" |
| `back` | Required, non-empty after trim | "Back side cannot be empty" |
| `front` | Max length: reasonable limit (e.g., 5000 chars) | "Front side is too long" |
| `back` | Max length: reasonable limit (e.g., 5000 chars) | "Back side is too long" |

**Database Constraints**:
- `CHECK (char_length(trim(front)) > 0)` enforced at DB level
- `CHECK (char_length(trim(back)) > 0)` enforced at DB level

### 4.2. Generation Validation

| Field | Validation Rule | Error Message |
|-------|-----------------|---------------|
| `source_text` | Required | "Source text is required" |
| `source_text` | Min length: 1000 characters | "Source text must be at least 1000 characters" |
| `source_text` | Max length: 10000 characters | "Source text must not exceed 10000 characters" |

### 4.3. SM-2 Algorithm Business Logic

The SM-2 algorithm implementation follows these rules for binary grading (Remember/Forgot):

**When user remembers (`remembered: true`)**:
```
if repetitions == 0:
    interval = 1
elif repetitions == 1:
    interval = 6
else:
    interval = round(interval * ease_factor)

repetitions += 1
ease_factor = min(2.5, ease_factor + 0.1)  // Slight increase, capped
```

**When user forgets (`remembered: false`)**:
```
repetitions = 0
interval = 1
ease_factor = max(1.3, ease_factor - 0.2)  // Decrease, minimum 1.3
```

**After each review**:
```
next_review_date = CURRENT_DATE + interval
last_reviewed_at = NOW()
```

### 4.4. Study Session Logic

1. **Fetch due cards**:
   - Review cards: `next_review_date <= CURRENT_DATE AND last_reviewed_at IS NOT NULL`
   - New cards: `last_reviewed_at IS NULL` (limited to 20)

2. **Card ordering**:
   - Review cards first (oldest `next_review_date` first)
   - Then new cards (oldest `created_at` first)

3. **Session completion**:
   - Session ends when all fetched cards have been reviewed
   - Frontend displays summary with counts

### 4.5. Generation Log Statistics

When saving flashcards from staging area via `POST /api/flashcards/batch`:

1. Count flashcards where `is_edited = false` → `accepted_unedited_count`
2. Count flashcards where `is_edited = true` → `accepted_edited_count`
3. Use `rejected_count` from request body
4. Update the `generation_logs` record with these counts

### 4.6. Progress Reset Logic

When resetting progress via `POST /api/flashcards/:id/reset-progress`:

```sql
UPDATE flashcards SET
    interval = 0,
    ease_factor = 2.5,
    repetitions = 0,
    next_review_date = CURRENT_DATE,
    last_reviewed_at = NULL
WHERE id = :id AND user_id = auth.uid();
```

### 4.7. AI Acceptance Rate Calculation

For metrics tracking:
```sql
SELECT 
    ROUND(
        (SUM(accepted_unedited_count)::DECIMAL / NULLIF(SUM(generated_count), 0)) * 100, 
        2
    ) as acceptance_rate
FROM generation_logs
WHERE user_id = auth.uid();
```

### 4.8. AI Adoption Rate Calculation

```sql
SELECT 
    ROUND(
        (COUNT(*) FILTER (WHERE is_ai_generated = true)::DECIMAL / COUNT(*)) * 100,
        2
    ) as adoption_rate
FROM flashcards
WHERE user_id = auth.uid();
```
