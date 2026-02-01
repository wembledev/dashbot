import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Sidebar from "@/components/sidebar/Sidebar"
import type { SidebarData, DetailSelection } from "@/types/sidebar"

vi.mock("@inertiajs/react", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
  usePage: () => ({ url: "/dashboard" }),
  router: { delete: vi.fn() },
}))

const mockOnSelect = vi.fn()

function renderSidebar(data: SidebarData, connected: boolean, selection: DetailSelection | null = null) {
  return render(
    <Sidebar data={data} connected={connected} selection={selection} onSelect={mockOnSelect} />
  )
}

const mockData: SidebarData = {
  mainAgent: {
    model: "claude-sonnet-4-20250514",
    status: "running",
    sessionAge: "2h 15m",
    running: true,
  },
  subAgents: [
    {
      label: "dashbot-review",
      model: "claude-opus-4-5",
      status: "running",
      task: "Code review and cleanup",
      startedAt: new Date(Date.now() - 600_000).toISOString(),
      duration: null,
      sessionKey: "agent:main:subagent:abc123",
    },
    {
      label: "seed-tasks",
      model: "claude-opus-4-5",
      status: "completed",
      task: null,
      startedAt: new Date(Date.now() - 1_800_000).toISOString(),
      duration: "5m",
      sessionKey: "agent:main:subagent:def456",
    },
  ],
  sessions: [
    { key: "agent:main:main", type: "main", label: "Main Session", status: "active", model: "sonnet", contextPercent: 25 },
    { key: "agent:main:channel:dashbot", type: "dashbot", label: "DashBot Chat", status: "active", model: "sonnet", contextPercent: 10 },
  ],
  crons: [
    { id: "morning", name: "Morning briefing", schedule: "0 7 * * *", nextRun: "in 8h", lastRun: "today 7:00 AM", status: "ok" },
  ],
  metrics: { agentCount: 2, sessionCount: 3, cronCount: 1 },
}

describe("Sidebar", () => {
  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  it("renders Agents section label", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("Agents")).toBeInTheDocument()
  })

  it("renders Main Agent card", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("Main Agent")).toBeInTheDocument()
  })

  it("shows running sub-agents", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("dashbot-review")).toBeInTheDocument()
  })

  it("shows completed sub-agents under Recent", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("seed-tasks")).toBeInTheDocument()
    expect(screen.getByText(/Recent/)).toBeInTheDocument()
  })

  it("renders crons section as nav item", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("Crons")).toBeInTheDocument()
    expect(screen.getByText(/1 job/)).toBeInTheDocument()
  })

  it("renders sessions section as nav item", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("Sessions")).toBeInTheDocument()
    expect(screen.getByText(/2 total/)).toBeInTheDocument()
  })

  it("calls onSelect when main agent is clicked", async () => {
    const user = userEvent.setup()
    renderSidebar(mockData, true)

    await user.click(screen.getByText("Main Agent"))
    expect(mockOnSelect).toHaveBeenCalledWith({ type: "agent-main", id: "main" })
  })

  it("calls onSelect when sub-agent is clicked", async () => {
    const user = userEvent.setup()
    renderSidebar(mockData, true)

    await user.click(screen.getByText("dashbot-review"))
    expect(mockOnSelect).toHaveBeenCalledWith({ type: "agent-sub", id: "dashbot-review" })
  })

  it("highlights selected main agent", () => {
    renderSidebar(mockData, true, { type: "agent-main", id: "main" })
    // The main agent button should have the selected styling
    const mainButton = screen.getByText("Main Agent").closest("button")
    expect(mainButton).toHaveClass("bg-blue-500/10")
  })

  it("highlights selected sub-agent", () => {
    renderSidebar(mockData, true, { type: "agent-sub", id: "dashbot-review" })
    const subButton = screen.getByText("dashbot-review").closest("button")
    expect(subButton).toHaveClass("bg-blue-500/10")
  })
})
