# AI-Powered Incident Response Platform

A modern SaaS application built with React, TypeScript, and CopilotKit that demonstrates how to integrate AI assistance into a web application. TaskFlow features a beautiful, responsive UI with real-time AI interaction capabilities.

## 🚀 Features

- **Modern SaaS Design**: Clean, professional interface with gradient accents and smooth animations
- **AI-Powered Assistant**: Integrated CopilotKit AI assistant that can read and understand your app's state
- **Real-time State Reading**: The AI can see and interact with your application data (e.g., counter values)
- **Self-Hosted Runtime**: Full control over your AI backend with Express.js server
- **TypeScript Support**: Fully typed for better developer experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.19+ or 22.12+ (required for Vite)
- **pnpm** (package manager) - [Install pnpm](https://pnpm.io/installation)
- **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

## 🛠️ Installation

1. **Clone the repository** (or navigate to your project directory):
   ```bash
   cd simple-react-app
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```
   
   Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   ⚠️ **Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

## 🏃 Running the Application

### Option 1: Run Both Servers Concurrently (Recommended)

This starts both the frontend (Vite) and backend (Express) servers at once:

```bash
pnpm dev:all
```

- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:4000 (CopilotKit runtime)

### Option 2: Run Servers Separately

**Terminal 1 - Backend Server:**
```bash
pnpm dev:server
```

**Terminal 2 - Frontend Server:**
```bash
pnpm dev
```

### Production Build

To build for production:

```bash
pnpm build
```

The built files will be in the `dist` directory.

## 🧠 How CopilotKit Works Under the Hood

CopilotKit enables your application to have an AI assistant that can understand and interact with your app's state. Here's how it works in this project:

### Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   React App     │◄────────┤  CopilotKit      │◄────────┤   OpenAI    │
│  (Frontend)     │  State  │  Runtime Server  │  API    │   API       │
│  localhost:5173 │  Sync   │  localhost:4000  │  Calls  │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

### 1. Frontend Integration (`src/App.tsx`)

The React app is wrapped with the `CopilotKit` provider:

```tsx
<CopilotKit
  runtimeUrl="http://localhost:4000/copilotkit"
>
  {/* Your app components */}
  <CopilotPopup
    instructions="You are a helpful assistant..."
  />
</CopilotKit>
```

**Key Components:**
- **`CopilotKit`**: The main provider that connects your app to the runtime server
- **`CopilotPopup`**: The chat UI component that users interact with
- **`runtimeUrl`**: Points to your self-hosted CopilotKit runtime server

### 2. State Reading with `useCopilotReadable`

The `Counter` component demonstrates how to make app state readable by the AI:

```tsx
import { useCopilotReadable } from '@copilotkit/react-core'

export function Counter() {
  const [count, setCount] = useState(0)

  // This makes the count value visible to the AI assistant
  useCopilotReadable({
    description: 'The current count value in the counter',
    value: count,
  })

  return (
    // ... component JSX
  )
}
```

**How it works:**
- `useCopilotReadable` adds the component's state to CopilotKit's context
- The AI can now see and reference this value in conversations
- When the state changes, CopilotKit automatically updates the context
- The `description` helps the AI understand what the value represents

**Example AI Interaction:**
- User: "What's the current count?"
- AI: "The current count is 5" (reads from `useCopilotReadable`)

### 3. Backend Runtime Server (`server.js`)

The Express server hosts the CopilotKit runtime:

```javascript
import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNodeHttpEndpoint } from '@copilotkit/runtime'

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const serviceAdapter = new OpenAIAdapter({ openai })

// Create and configure runtime
const runtime = new CopilotRuntime()
runtime.handleServiceAdapter(serviceAdapter)

// Create HTTP endpoint handler
const handler = copilotRuntimeNodeHttpEndpoint({
  endpoint: '/copilotkit',
  runtime,
  serviceAdapter,
})

// Mount on Express
app.use('/copilotkit', handler)
```

**What happens:**
1. **OpenAI Adapter**: Connects CopilotKit to OpenAI's API
2. **CopilotRuntime**: Manages the AI agent and handles requests
3. **HTTP Endpoint**: Exposes the runtime at `/copilotkit`
4. **State Sync**: The runtime receives app state from the frontend and uses it in AI responses

### 4. Communication Flow

When a user interacts with the AI assistant:

1. **User sends message** → CopilotPopup captures it
2. **Frontend sends request** → POST to `http://localhost:4000/copilotkit`
3. **Runtime processes** → Includes app context (from `useCopilotReadable`)
4. **OpenAI API call** → Sends context + user message to OpenAI
5. **Response received** → AI response includes app-aware information
6. **Frontend displays** → Response shown in CopilotPopup

### 5. Context Management

CopilotKit maintains a context object that includes:
- All values registered via `useCopilotReadable`
- Component descriptions
- Current app state

This context is automatically included in every AI request, making the assistant aware of your app's current state.

## 📁 Project Structure

```
simple-react-app/
├── src/
│   ├── components/
│   │   ├── Counter.tsx          # Counter component with useCopilotReadable
│   │   └── ErrorBoundary.tsx    # React error boundary
│   ├── App.tsx                  # Main app component with CopilotKit setup
│   ├── main.tsx                 # React entry point
│   └── style.css                # Global styles
├── server.js                    # Express server with CopilotKit runtime
├── .env                         # Environment variables (not committed)
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

### Server Configuration

The backend server runs on port `4000` by default. To change it, modify `server.js`:

```javascript
app.listen(4000, () => {
  // Change 4000 to your desired port
})
```

And update the `runtimeUrl` in `src/App.tsx`:

```tsx
<CopilotKit runtimeUrl="http://localhost:YOUR_PORT/copilotkit">
```

## 🐛 Troubleshooting

### "Agent 'default' not found" Error

**Problem**: The runtime server isn't properly registering the agent.

**Solutions**:
1. Ensure the backend server is running on port 4000
2. Check that `OPENAI_API_KEY` is set in your `.env` file
3. Verify the `runtimeUrl` in `App.tsx` matches your server URL
4. Restart both servers

### CORS Errors

**Problem**: Browser blocks requests between frontend and backend.

**Solution**: The server already includes CORS middleware. If issues persist, check that:
- Frontend is running on the expected port (usually 5173)
- Backend CORS is configured correctly in `server.js`

### "OPENAI_API_KEY is not set" Error

**Problem**: The `.env` file is missing or the key isn't loaded.

**Solutions**:
1. Create a `.env` file in the root directory
2. Add `OPENAI_API_KEY=your_key_here`
3. Restart the server (environment variables load on startup)

### Port Already in Use

**Problem**: Port 4000 or 5173 is already in use.

**Solutions**:
- Change the port in `server.js` (backend)
- Vite will automatically use the next available port (frontend)
- Or kill the process using the port:
  ```bash
  lsof -ti:4000 | xargs kill -9
  ```

## 📚 Learn More

- [CopilotKit Documentation](https://docs.copilotkit.ai/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify it for your own use!

## 📝 License

This project is open source and available for personal and commercial use.

---

**Built with ❤️ using React, TypeScript, and CopilotKit**
