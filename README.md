# Agentic Incident Response

An incident response platform built with React, TypeScript, and [CopilotKit](https://docs.copilotkit.ai/). Track, triage, and resolve security and operational incidents with an AI assistant that can read your data, update statuses, generate analysis, and render charts — all from the chat sidebar.

## What It Does

- **Incident tracking** — Report, filter, search, and manage incidents across their lifecycle (Open → Investigating → Mitigated → Resolved) with P0–P4 severity levels.
- **Dashboard** — Live metrics for active incidents, MTTR, and recent resolutions. Cross-incident activity timeline.
- **Detail views** — Three-tab incident modal (Overview, Timeline, Analysis) with status updates, comments, and service impact tracking.
- **Security analysis** — On-demand risk scoring, security event logs, affected asset mapping, related incident correlation, and step-by-step runbooks.
- **Charts** — Severity distribution, status breakdown, incident timeline, and service impact visualizations (Recharts).
- **AI assistant** — CopilotKit sidebar that can resolve incidents, change statuses, add comments, create new incidents, run analysis, and generate charts through natural language.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, CopilotKit, Recharts
**Backend:** Express, CopilotKit Runtime, OpenAI API

## Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm
- [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

```bash
pnpm install
```

Create a `.env` file:

```
OPENAI_API_KEY=your_key_here
```

## Running

```bash
pnpm dev:all
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:4000`.

To run them separately:

```bash
pnpm dev:server   # backend
pnpm dev          # frontend
```

## How CopilotKit Fits In

The app wraps its UI in a `CopilotKit` provider connected to a self-hosted Express runtime (`server.js`). From there:

- **`useCopilotReadable`** exposes the incident list, metrics, and selected incident to the AI so it has full context.
- **`useFrontendTool`** registers six actions the AI can call: resolve incidents, update statuses, add comments, report new incidents, run security analysis, and generate charts.
- **`CopilotSidebar`** provides the chat interface with suggested prompts for common tasks.

The backend is a thin Express server that proxies requests to OpenAI through `CopilotRuntime`.

## Project Structure

```
src/
├── App.tsx                        # Layout, state, filtering, CopilotKit setup
├── components/
│   ├── CounterController.tsx      # AI tool definitions
│   ├── IncidentForm.tsx           # Report incident form
│   ├── IncidentsList.tsx          # Filterable incident list
│   ├── IncidentDetail.tsx         # Detail modal (overview/timeline/analysis)
│   ├── AnalysisPanel.tsx          # Security analysis display
│   ├── CrossIncidentTimeline.tsx  # Cross-incident activity feed
│   └── charts/IncidentCharts.tsx  # Recharts visualizations
├── types/                         # Incident and analysis types
├── data/                          # Seed data and mock analysis generators
├── services/                      # In-memory DB and mock API layer
└── style.css

server.js                          # Express + CopilotKit runtime
```
## MIT License