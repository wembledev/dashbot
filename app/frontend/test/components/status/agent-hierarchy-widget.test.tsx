import { render, screen } from "@testing-library/react"
import AgentHierarchyWidget from "@/components/status/agent-hierarchy-widget"

const mockSessions = [
  {
    key: "agent:main:main",
    kind: "direct",
    model: "claude-sonnet-4-6",
    tokens: "50k/200k",
    context_percent: 25,
    age: "5m ago",
    flags: "system",
  },
  {
    key: "agent:main:cron:morning-briefing",
    kind: "direct",
    model: "claude-sonnet-4-6",
    tokens: "2k/200k",
    context_percent: 1,
    age: "1h ago",
    flags: "",
  },
]

describe("AgentHierarchyWidget", () => {
  it("renders the widget title", () => {
    render(<AgentHierarchyWidget sessions={mockSessions} />)
    expect(screen.getByText("Sessions")).toBeInTheDocument()
  })

  it("shows session count in description", () => {
    render(<AgentHierarchyWidget sessions={mockSessions} />)
    expect(screen.getByText("2 sessions")).toBeInTheDocument()
  })

  it("renders session rows", () => {
    render(<AgentHierarchyWidget sessions={mockSessions} />)
    expect(screen.getByText("Main: Router session")).toBeInTheDocument()
    expect(screen.getByText("Cron: Morning Briefing")).toBeInTheDocument()
  })

  it("shows empty state when no sessions", () => {
    render(<AgentHierarchyWidget sessions={[]} />)
    expect(screen.getByText("No active sessions")).toBeInTheDocument()
  })
})
