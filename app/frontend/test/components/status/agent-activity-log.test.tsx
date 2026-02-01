import { render, screen } from "@testing-library/react"
import AgentActivityLog from "@/components/status/agent-activity-log"

vi.mock("@/lib/cable", () => ({
  cable: {
    subscriptions: {
      create: vi.fn(() => ({
        unsubscribe: vi.fn(),
      })),
    },
  },
}))

const mockEvents = [
  {
    id: 1,
    event_type: "spawned",
    agent_label: "build-feature",
    session_key: "agent:main:subagent:abc123",
    model: "claude-opus-4-5",
    description: "Build the new dashboard feature",
    metadata: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    event_type: "completed",
    agent_label: "seed-tasks",
    session_key: "agent:main:subagent:def456",
    model: "claude-opus-4-5",
    description: "Seeded tasks from TODO.md",
    metadata: { duration_seconds: 320, result: "34 tasks created" },
    created_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 3,
    event_type: "cron_run",
    agent_label: "morning-briefing",
    session_key: null,
    model: "claude-sonnet-4-5",
    description: "Morning briefing completed",
    metadata: { duration_seconds: 12 },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

describe("AgentActivityLog", () => {
  it("renders the widget title", () => {
    render(<AgentActivityLog initialEvents={mockEvents} />)
    expect(screen.getByText("Activity Log")).toBeInTheDocument()
  })

  it("shows event count", () => {
    render(<AgentActivityLog initialEvents={mockEvents} />)
    expect(screen.getByText("3 recent events")).toBeInTheDocument()
  })

  it("shows spawned events", () => {
    render(<AgentActivityLog initialEvents={mockEvents} />)
    expect(screen.getByText("build-feature")).toBeInTheDocument()
    expect(screen.getByText("Spawned")).toBeInTheDocument()
  })

  it("shows completed events", () => {
    render(<AgentActivityLog initialEvents={mockEvents} />)
    expect(screen.getByText("seed-tasks")).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
  })

  it("shows cron events", () => {
    render(<AgentActivityLog initialEvents={mockEvents} />)
    expect(screen.getByText("morning-briefing")).toBeInTheDocument()
    expect(screen.getByText("Cron")).toBeInTheDocument()
  })

  it("shows empty state when no events", () => {
    render(<AgentActivityLog initialEvents={[]} />)
    expect(screen.getByText("Agent events will appear here in real-time")).toBeInTheDocument()
  })

  it("shows event descriptions", () => {
    render(<AgentActivityLog initialEvents={mockEvents} />)
    expect(screen.getByText("Build the new dashboard feature")).toBeInTheDocument()
  })

  it("shows model badges", () => {
    render(<AgentActivityLog initialEvents={mockEvents} />)
    const opusBadges = screen.getAllByText("claude-opus-4-5")
    expect(opusBadges.length).toBeGreaterThan(0)
  })
})
