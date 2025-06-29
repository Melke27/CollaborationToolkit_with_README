# Collaboration Toolkit

This is a full-stack real-time collaboration tool featuring video conferencing, chat, screen sharing, file sharing, and a collaborative whiteboard.

## Project Structure

The project is divided into two main parts:

-   `client/`: The frontend application built with React.
-   `server/`: The backend API and WebSocket server built with Node.js and Express.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Node.js** (LTS version recommended): [https://nodejs.org/](https://nodejs.org/)
-   **npm** (Node Package Manager) or **pnpm** (performant Node.js package manager): npm comes with Node.js; for pnpm, see [https://pnpm.io/](https://pnpm.io/)
-   **Git** (for cloning the repository, if applicable): [https://git-scm.com/](https://git-scm.com/)
-   **VS Code** (or your preferred code editor): [https://code.visualstudio.com/](https://code.visualstudio.com/)

## Getting Started

Follow these steps to set up and run the application in your local development environment.

### 1. Clone the Repository (if you haven't already)

If you received this project as a zip file, extract it to your desired location. If it's a Git repository, clone it:

```bash
git clone <repository-url>
cd CollaborationToolkit
```

### 2. Install Dependencies

You need to install dependencies for both the backend and the frontend.

#### Backend Dependencies

Navigate to the `server` directory and install the Node.js packages:

```bash
cd server
pnpm install # or npm install
cd .. # Go back to the project root
```

#### Frontend Dependencies

Navigate to the `client` directory and install the Node.js packages:

```bash
cd client
pnpm install # or npm install
cd .. # Go back to the project root
```

### 3. Environment Variables (Optional, but Recommended)

Check if there are any `.env.example` files in either the `client` or `server` directories. If so, copy them to `.env` and fill in the necessary values (e.g., database connection strings, API keys, JWT secrets).

-   `server/.env`
-   `client/.env`

### 4. Running the Application

You will need to run both the backend and frontend concurrently.

#### Start the Backend Server

Open a new terminal in VS Code (Terminal > New Terminal) and navigate to the `server` directory:

```bash
cd server
pnpm dev # or npm run dev
```

This will typically start the backend server on `http://localhost:5000` (or another port specified in its configuration).

#### Start the Frontend Development Server

Open another new terminal in VS Code and navigate to the `client` directory:

```bash
cd client
pnpm dev # or npm run dev
```

This will typically start the frontend development server on `http://localhost:3000` (or another port specified by Vite/React).

### 5. Access the Application

Once both servers are running, open your web browser and navigate to the address where the frontend is served (e.g., `http://localhost:3000`).

## VS Code Tips

-   **Integrated Terminal:** Use VS Code's integrated terminal (Ctrl+` or View > Terminal) to run commands for both the client and server simultaneously.
-   **Extensions:** Consider installing extensions like:
    -   **ESLint:** For JavaScript/TypeScript linting.
    -   **Prettier:** For code formatting.
    -   **Docker:** If you plan to containerize the application.
    -   **Live Share:** For collaborative development.
-   **Workspace:** You can open the `CollaborationToolkit` folder as a workspace in VS Code to easily manage both `client` and `server` directories.

## Troubleshooting

-   **Port Conflicts:** If a server fails to start due to a port being in use, you can either change the port in the respective configuration files (`server/index.ts` or `client/vite.config.ts`) or free up the port.
-   **Dependencies:** If you encounter errors related to missing modules, ensure you have run `pnpm install` (or `npm install`) in both the `client` and `server` directories.
-   **Backend/Frontend Communication:** Ensure the `API_BASE_URL` in your frontend (e.g., `client/src/lib/utils.ts` or similar) points to the correct backend address (e.g., `http://localhost:5000`).

---

Feel free to explore the codebase and contribute!

