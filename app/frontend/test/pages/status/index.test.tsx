import { render, screen } from "@testing-library/react"
import StatusIndex from "@/pages/status/index"
import { UnreadProvider } from "@/contexts/unread-context"

vi.mock("@inertiajs/react", () => ({
  router: {
    delete: vi.fn(),
    visit: vi.fn(),
  },
  usePage: () => ({ url: "/status" }),
}))

vi.mock("@/lib/cable", () => ({
  cable: {
    subscriptions: {
      create: vi.fn(() => ({
        unsubscribe: vi.fn(),
      })),
    },
  },
}))

function renderWithProvider(component: React.ReactElement) {
  return render(<UnreadProvider>{component}</UnreadProvider>)
}

const mockStatusData = {
  agent_status: {
    running: true,
    session_count: 5,
    main_session_age: "2m ago",
    main_model: "claude-opus-4-5",
  },
  token_burn: {
    main_tokens: "166k/200k",
    main_context_percent: 83,
    total_sessions: 5,
    model: "claude-opus-4-5",
  },
  tasks: {
    cron_jobs: [
      {
        id: "1",
        name: "Morning briefing",
        schedule: "cron 0 7 * * *",
        next_run: "in 11h",
        last_run: "13h ago",
        status: "ok",
        target: "isolated",
        agent: "default",
      },
    ],
    pending_count: 0,
    next_job: "Morning briefing",
    cron_health: "healthy" as const,
    cron_errors: [],
  },
  memory: {
    backend: "qmd" as const,
    file_count: 104,
    vector_count: 558,
    index_size: "6.3 MB",
    updated: "2h ago",
    collections: [
      { name: "memory", pattern: "**/*.md", files: 104, updated: "2h ago" },
    ],
    chunk_count: 0,
    dirty: false,
    sources: "",
    vector_ready: false,
    fts_ready: false,
    cache_count: 0,
  },
  session_health: {
    uptime: "2m ago",
    model: "claude-opus-4-5",
    context_percent: 83,
    tokens: "166k/200k",
    session_key: "agent:main:main",
  },
  sessions: [
    {
      key: "agent:main:main",
      kind: "direct",
      model: "claude-opus-4-5",
      tokens: "166k/200k",
      context_percent: 83,
      age: "2m ago",
      flags: "system",
    },
  ],
  fetched_at: "2026-01-30 19:30:00 PST",
}

const mockEvents = [
  {
    id: 1,
    event_type: "spawned",
    agent_label: "test-task",
    session_key: "agent:main:subagent:abc123",
    model: "claude-opus-4-5",
    description: "Test task for building something",
    metadata: null,
    created_at: new Date().toISOString(),
  },
]

describe("StatusIndex", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve(mockStatusData),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the page title", () => {
    renderWithProvider(<StatusIndex status_data={mockStatusData} initial_events={mockEvents} />)
    expect(screen.getByRole("heading", { name: "Status" })).toBeInTheDocument()
  })

  it("renders hierarchy and activity widgets", () => {
    renderWithProvider(<StatusIndex status_data={mockStatusData} initial_events={mockEvents} />)
    expect(screen.getByText("Agent Hierarchy")).toBeInTheDocument()
    expect(screen.getByText("Activity Log")).toBeInTheDocument()
  })

  it("renders supporting widgets", () => {
    renderWithProvider(<StatusIndex status_data={mockStatusData} initial_events={mockEvents} />)
    expect(screen.getByText("Live Token Burn")).toBeInTheDocument()
    expect(screen.getByText("Session Health")).toBeInTheDocument()
    expect(screen.getByText("Cron Jobs")).toBeInTheDocument()
    expect(screen.getByText("Memory (QMD)")).toBeInTheDocument()
  })

  it("displays the fetched_at timestamp", () => {
    renderWithProvider(<StatusIndex status_data={mockStatusData} initial_events={mockEvents} />)
    expect(screen.getByText(/2026-01-30 19:30:00 PST/)).toBeInTheDocument()
  })

  it("has a refresh button", () => {
    renderWithProvider(<StatusIndex status_data={mockStatusData} initial_events={mockEvents} />)
    expect(screen.getByLabelText("Refresh status")).toBeInTheDocument()
  })

  it("renders the subtitle", () => {
    renderWithProvider(<StatusIndex status_data={mockStatusData} initial_events={mockEvents} />)
    // Subtitle removed in density pass — page header is now compact
  })
})
