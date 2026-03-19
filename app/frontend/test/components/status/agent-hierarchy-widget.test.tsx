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
    key: "agent:main:cron:morning-briefing",
    kind: "direct",
    model: "claude-sonnet-4-5",
    tokens: "2k/200k",
    context_percent: 1,
    age: "1h ago",
    flags: "",
  },
]

describe("AgentHierarchyWidget", () => {
  it("renders the widget title", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} />)
    expect(screen.getByText("Agent Hierarchy")).toBeInTheDocument()
  })

  it("shows the main agent card", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} />)
    expect(screen.getByText("Main Agent")).toBeInTheDocument()
    expect(screen.getByText("claude-sonnet-4-5")).toBeInTheDocument()
  })

  it("shows sessions section (collapsed by default)", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} />)
    expect(screen.getByText(/Sessions \(2\)/)).toBeInTheDocument()
  })

  it("shows how agents work help", () => {
    render(<AgentHierarchyWidget data={mockData} sessions={mockSessions} />)
    expect(screen.getByText("How agents work")).toBeInTheDocument()
  })
})
