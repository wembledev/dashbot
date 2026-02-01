import { render, screen } from "@testing-library/react"
import AgentHierarchyWidget from "@/components/status/agent-hierarchy-widget"

const mockData = {
  running: true,
  session_count: 3,
  main_session_age: "5m ago",
  main_model: "claude-sonnet-4-5",
}

const mockSessions = [
  {
    key: "agent:main:main",
    kind: "direct",
    model: "claude-sonnet-4-5",
    tokens: "50k/200k",
    context_percent: 25,
    age: "5m ago",
    flags: "system",
  },
  {
    key: "agent:main:subagent:abc12345-def6-7890",
    kind: "direct",
    model: "claude-opus-4-5",
    tokens: "80k/200k",
    context_percent: 40,
    age: "3m ago",
    flags: "",
  },
  {
    key: "agent:main:cron:morning-briefing",
    kind: "direct",
    model: "claude-sonnet-4-5",
    tokens: "2k/200k",
    context_percent: 1,
    age: "1h ago",
    flags: "",
  },
]

const mockEvents = [
  {
    id: 1,
    event_type: "spawned",
    agent_label: "build-feature",
    session_key: "agent:main:subagent:abc12345-def6-7890",
    model: "claude-opus-4-5",
    description: "Build the new feature",
    metadata: null,
    created_at: new Date(Date.now() - 180000).toISOString(), // 3m ago
  },
]

describe("AgentHierarchyWidget", () => {
  it("renders the widget title", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} events={mockEvents} />)
    expect(screen.getByText("Agent Hierarchy")).toBeInTheDocument()
  })

  it("shows the main agent card", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} events={mockEvents} />)
    expect(screen.getByText("Main Agent")).toBeInTheDocument()
    expect(screen.getByText("claude-sonnet-4-5")).toBeInTheDocument()
  })

  it("shows running sub-agents from events", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} events={mockEvents} />)
    expect(screen.getByText("build-feature")).toBeInTheDocument()
  })

  it("shows sub-agent count", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} events={mockEvents} />)
    expect(screen.getByText(/Sub-agents \(1\)/)).toBeInTheDocument()
  })

  it("shows sessions section (collapsed by default)", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} events={mockEvents} />)
    expect(screen.getByText(/Sessions \(3\)/)).toBeInTheDocument()
  })

  it("shows how agents work help", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} events={mockEvents} />)
    expect(screen.getByText("How agents work")).toBeInTheDocument()
  })

  it("shows completed sub-agent", () => {
    const completedEvents = [
      ...mockEvents,
      {
        id: 2,
        event_type: "completed",
        agent_label: "build-feature",
        session_key: "agent:main:subagent:abc12345-def6-7890",
        model: "claude-opus-4-5",
        description: "Feature built successfully",
        metadata: { duration_seconds: 300, result: "PR #7 created" },
        created_at: new Date().toISOString(),
      },
    ]

    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} events={completedEvents} />)
    expect(screen.getByText("build-feature")).toBeInTheDocument()
    expect(screen.getByText("Done")).toBeInTheDocument()
  })
})
