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
    model: "claude-sonnet-4-6",
    status: "running",
    sessionAge: "2h 15m",
    running: true,
  },
  subAgents: [],
  sessions: [
    { key: "agent:main:main", type: "main", label: "Main Session", status: "active", model: "sonnet", contextPercent: 25 },
    { key: "dashbot:default", type: "dashbot", label: "DashBot Chat", status: "active", model: "sonnet", contextPercent: 10 },
  ],
  crons: [
    { id: "morning", name: "Morning briefing", schedule: "0 7 * * *", nextRun: "in 8h", lastRun: "today 7:00 AM", status: "ok" },
  ],
  metrics: { agentCount: 1, sessionCount: 2, cronCount: 1 },
}

describe("Sidebar", () => {
  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  it("renders Agent section label when running", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("Agent")).toBeInTheDocument()
  })

  it("renders Main Agent card when running", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("Main Agent")).toBeInTheDocument()
  })

  it("hides Main Agent card when not running", () => {
    const stoppedData = { ...mockData, mainAgent: { ...mockData.mainAgent, running: false, status: "idle" as const } }
    renderSidebar(stoppedData, true)
    expect(screen.queryByText("Main Agent")).not.toBeInTheDocument()
  })

  it("renders crons section", () => {
    renderSidebar(mockData, true)
    expect(screen.getByText("Crons")).toBeInTheDocument()
    expect(screen.getByText(/1 job/)).toBeInTheDocument()
  })

  it("renders sessions section", () => {
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

  it("highlights selected main agent", () => {
    renderSidebar(mockData, true, { type: "agent-main", id: "main" })
    const mainButton = screen.getByText("Main Agent").closest("button")
    expect(mainButton).toHaveClass("bg-blue-500/10")
  })

  it("shows waiting state when no data", () => {
    const emptyData: SidebarData = {
      mainAgent: { model: "unknown", status: "idle", sessionAge: "unknown", running: false },
      subAgents: [],
      sessions: [],
      crons: [],
      metrics: { agentCount: 0, sessionCount: 0, cronCount: 0 },
    }
    renderSidebar(emptyData, false)
    expect(screen.getByText("Waiting for OpenClaw...")).toBeInTheDocument()
  })
})
