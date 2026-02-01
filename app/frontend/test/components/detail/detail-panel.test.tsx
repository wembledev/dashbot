import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DetailPanel from "@/components/detail/DetailPanel"
import type { SidebarData, DetailSelection } from "@/types/sidebar"

vi.mock("@inertiajs/react", () => ({
  router: { visit: vi.fn() },
  usePage: () => ({ url: "/dashboard" }),
}))

const mockData: SidebarData = {
  mainAgent: {
    model: "claude-opus-4-5",
    status: "running",
    sessionAge: "2h 15m",
    running: true,
    inputTokens: "45.2K",
    contextPercent: 32,
  },
  subAgents: [
    {
      label: "sidebar-v2",
      model: "claude-opus-4-5",
      status: "running",
      task: "Building sidebar redesign",
      startedAt: new Date(Date.now() - 600_000).toISOString(),
      duration: null,
      sessionKey: "agent:main:subagent:abc123",
    },
  ],
  sessions: [
    {
      key: "agent:main:main",
      type: "main",
      label: "Main Session",
      status: "active",
      model: "claude-opus-4-5",
      contextPercent: 32,
      age: "2h",
      tokens: "45.2K",
    },
  ],
  crons: [
    {
      id: "morning-brief",
      name: "Morning Briefing",
      schedule: "0 7 * * *",
      nextRun: "Tomorrow 7:00 AM",
      lastRun: "Today 7:00 AM",
      status: "ok",
      enabled: true,
      target: "isolated",
    },
  ],
  metrics: { agentCount: 2, sessionCount: 1, cronCount: 1 },
}

describe("DetailPanel", () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it("renders empty state when no selection", () => {
    render(<DetailPanel selection={null} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Select an item")).toBeInTheDocument()
  })

  it("renders main agent detail when agent-main selected", () => {
    const sel: DetailSelection = { type: "agent-main", id: "main" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Main Agent")).toBeInTheDocument()
    // Model appears in multiple places (header + info card), just check it exists
    expect(screen.getAllByText("claude-opus-4-5").length).toBeGreaterThan(0)
  })

  it("renders sub-agent detail when agent-sub selected", () => {
    const sel: DetailSelection = { type: "agent-sub", id: "sidebar-v2" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("sidebar-v2")).toBeInTheDocument()
    expect(screen.getByText("Building sidebar redesign")).toBeInTheDocument()
  })

  it("renders cron detail when cron selected", () => {
    const sel: DetailSelection = { type: "cron", id: "morning-brief" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Morning Briefing")).toBeInTheDocument()
    // Schedule appears in multiple places (header + info card)
    expect(screen.getAllByText("0 7 * * *").length).toBeGreaterThan(0)
  })

  it("renders session detail when session selected", () => {
    const sel: DetailSelection = { type: "session", id: "agent:main:main" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Main Session")).toBeInTheDocument()
    expect(screen.getByText("agent:main:main")).toBeInTheDocument()
  })

  it("shows not found for missing sub-agent", () => {
    const sel: DetailSelection = { type: "agent-sub", id: "nonexistent" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Item not found")).toBeInTheDocument()
  })

  it("shows not found for missing cron", () => {
    const sel: DetailSelection = { type: "cron", id: "nonexistent" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Item not found")).toBeInTheDocument()
  })

  it("shows not found for missing session", () => {
    const sel: DetailSelection = { type: "session", id: "nonexistent" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Item not found")).toBeInTheDocument()
  })

  it("navigates from sub-agent back to main via callback", async () => {
    const user = userEvent.setup()
    const sel: DetailSelection = { type: "agent-sub", id: "sidebar-v2" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)

    await user.click(screen.getByText("← Back to Main Agent"))
    expect(mockOnChange).toHaveBeenCalledWith({ type: "agent-main", id: "main" })
  })

  it("shows token usage section for main agent", () => {
    const sel: DetailSelection = { type: "agent-main", id: "main" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Token Usage")).toBeInTheDocument()
    // Token value appears in multiple spots
    expect(screen.getAllByText("45.2K").length).toBeGreaterThan(0)
  })

  it("shows context bar for session detail", () => {
    const sel: DetailSelection = { type: "session", id: "agent:main:main" }
    render(<DetailPanel selection={sel} data={mockData} onSelectionChange={mockOnChange} />)
    expect(screen.getByText("Context Window")).toBeInTheDocument()
    // 32% appears in info card and context bar
    expect(screen.getAllByText("32%").length).toBeGreaterThan(0)
  })
})
