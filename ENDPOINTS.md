# API Endpoints Documentation

## API Overview
- **Base URL:** `http://localhost:3001/`
- **Framework:** tRPC with Bun runtime
- **CORS:** Enabled for all origins

---

## Root Endpoints

### **`hello`** (query - public)
- Returns a simple "Hello, world!" message
- Emits a ping event to demonstrate subscriptions

### **`ping`** (subscription - public)
- Listens for ping events and yields "pong" responses
- Used for real-time event testing

---

## Admin Routes (`admin.*`)

### **`admin.createAdmin`** (mutation - public)
- Creates a new admin account
- **Input:** `{ username: string, password: string, inviteCode?: string }`
- **Returns:** Admin object and session token
- **Note:** First admin doesn't need invite code; subsequent admins require valid invite code

### **`admin.login`** (mutation - public)
- Authenticates an admin user
- **Input:** `{ username: string, password: string }`
- **Returns:** Admin object and session token

### **`admin.me`** (query - admin only)
- Returns current authenticated admin's profile
- **Returns:** `{ id, username, createdAt }`

### **`admin.logout`** (mutation - admin only)
- Invalidates expired sessions for the current admin
- **Returns:** `{ success: true }`

---

## Quiz Routes (`quiz.*`)

### **`quiz.createQuiz`** (mutation - admin only)
- Creates a new quiz
- **Input:** `{ name: string, description: string }`
- **Returns:** Created quiz object

### **`quiz.getQuizzes`** (query - admin only)
- Retrieves all quizzes
- **Returns:** Array of quiz objects

### **`quiz.getQuiz`** (query - admin only)
- Gets a specific quiz by ID
- **Input:** `{ id: string }`
- **Returns:** Quiz object

### **`quiz.updateQuiz`** (mutation - admin only)
- Updates an existing quiz
- **Input:** `{ id: string, name: string, description: string }`
- **Returns:** Updated quiz object

### **`quiz.deleteQuiz`** (mutation - admin only)
- Deletes a quiz
- **Input:** `{ id: string }`
- **Returns:** `{ success: true }`

---

## Question Routes (`question.*`)

### **`question.createQuestion`** (mutation - admin only)
- Creates a new question for a quiz
- **Input:** `{ quizId: string, text: string, order: number }`
- **Returns:** Created question object

### **`question.getQuestions`** (query - admin only)
- Gets all questions for a specific quiz
- **Input:** `{ quizId: string }`
- **Returns:** Array of questions with their options

### **`question.getQuestion`** (query - admin only)
- Gets a specific question by ID
- **Input:** `{ id: string }`
- **Returns:** Question object with options

### **`question.updateQuestion`** (mutation - admin only)
- Updates a question
- **Input:** `{ id: string, text: string, order: number }`
- **Returns:** Updated question object

### **`question.deleteQuestion`** (mutation - admin only)
- Deletes a question
- **Input:** `{ id: string }`
- **Returns:** `{ success: true }`

### **`question.createOption`** (mutation - admin only)
- Creates an answer option for a question
- **Input:** `{ questionId: string, text: string, isCorrect: boolean }`
- **Returns:** Created option object

### **`question.updateOption`** (mutation - admin only)
- Updates an answer option
- **Input:** `{ id: string, text: string, isCorrect: boolean }`
- **Returns:** Updated option object

### **`question.deleteOption`** (mutation - admin only)
- Deletes an answer option
- **Input:** `{ id: string }`
- **Returns:** `{ success: true }`

### **`question.createQuestionsWithAi`** (mutation - admin only)
- Generates quiz questions using AI (Gemini 2.5 Flash)
- **Input:** `{ prompt: string }`
- **Returns:** Complete quiz with ~15 AI-generated questions and options
- **Note:** Creates both the quiz and all questions/options in one operation

---

## Game Routes (`game.*`)

### **`game.getGames`** (query - admin only)
- Lists all active games
- **Returns:** Array of game summaries with player/team counts

### **`game.getGame`** (query - admin only)
- Gets detailed game information
- **Input:** `{ gameId: string }`
- **Returns:** Full game object with teams and players

### **`game.getGameByCode`** (query - public)
- Finds a game by its join code
- **Input:** `{ code: string }`
- **Returns:** Game info with teams (for joining)

### **`game.createGame`** (mutation - admin only)
- Creates a new game session
- **Input:** `{ name: string, quizId: string }`
- **Returns:** Game object with unique join code

### **`game.createTeam`** (mutation - public)
- Creates a team in a game
- **Input:** `{ gameId: string, teamName: string }`
- **Returns:** Created team object

### **`game.joinGame`** (mutation - public)
- Adds a player to a team
- **Input:** `{ gameId: string, teamId: string, playerName: string }`
- **Returns:** Player object `{ id, name }`

### **`game.submitAnswer`** (mutation - public)
- Submits a player's answer to a question
- **Input:** `{ gameId: string, playerId: string, questionId: string, optionId: string }`
- **Returns:** `{ success: true }`
- **Note:** Only works during "questioning" phase

### **`game.gameEvents`** (subscription - public)
- Real-time game events stream
- **Input:** `{ gameId: string, playerId: string }`
- **Emits:**
  - `new_question` - When a new question is shown
  - `correct_option` - When results are revealed with scores
  - `end` - When game ends with final scores

### **`game.nextQuestion`** (mutation - admin only)
- Advances the game to the next question or phase
- **Input:** `{ gameId: string }`
- **Returns:** Current question number
- **Game Flow:**
  - `not-started` → shows first question → `questioning`
  - `questioning` → reveals answer and scores → `results`
  - `results` → shows next question or ends game
  - `ended` - final state

---

## Summary
- **Total Endpoints:** 34
- **Public Endpoints:** 10 (no auth required)
- **Admin Endpoints:** 24 (require admin session)
- **Subscriptions:** 2 (real-time streams)
- **Mutations:** 21 (write operations)
- **Queries:** 11 (read operations)

---

## Authentication

Admin-only endpoints require an admin session token obtained from either `admin.createAdmin` or `admin.login`. The session token should be included in the authorization context when making tRPC calls.

## Game Flow Example

1. Admin creates a quiz using `quiz.createQuiz`
2. Admin adds questions using `question.createQuestion` and `question.createOption`
3. Admin creates a game using `game.createGame` (gets join code)
4. Players use `game.getGameByCode` to find the game
5. Players create teams using `game.createTeam`
6. Players join teams using `game.joinGame`
7. Players subscribe to `game.gameEvents` for real-time updates
8. Admin calls `game.nextQuestion` to start and progress through questions
9. Players submit answers using `game.submitAnswer` during questioning phase
10. Admin calls `game.nextQuestion` to show results and advance
11. Game ends when all questions are completed