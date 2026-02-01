import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TopBar from "@/components/topbar/TopBar"
import { UnreadProvider } from "@/contexts/unread-context"
import type { SidebarData } from "@/types/sidebar"

vi.mock("@inertiajs/react", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
  usePage: () => ({ url: "/dashboard" }),
  router: { delete: vi.fn() },
}))

const mockData: SidebarData = {
  mainAgent: { model: "claude-opus-4-5", status: "running", sessionAge: "1h", running: true },
  subAgents: [],
  sessions: [],
  crons: [],
  metrics: { agentCount: 1, sessionCount: 1, cronCount: 0 },
}

function renderTopBar(connected = true, onMenuToggle = vi.fn()) {
  return render(
    <UnreadProvider>
      <TopBar data={mockData} connected={connected} onMenuToggle={onMenuToggle} />
    </UnreadProvider>
  )
}

describe("TopBar", () => {
  it("renders DashBot logo", () => {
    renderTopBar()
    expect(screen.getByText("DashBot")).toBeInTheDocument()
  })

  it("renders nav tabs: Chat, Status, Settings", () => {
    renderTopBar()
    expect(screen.getByText("Chat")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("does not render logout button (moved to settings)", () => {
    renderTopBar()
    expect(screen.queryByLabelText("Logout")).not.toBeInTheDocument()
  })

  it("shows connected indicator when connected", () => {
    renderTopBar(true)
    expect(screen.getByLabelText("Connected")).toBeInTheDocument()
  })

  it("shows disconnected indicator when not connected", () => {
    renderTopBar(false)
    expect(screen.getByLabelText("Disconnected")).toBeInTheDocument()
  })

  it("marks Chat tab as active on /dashboard", () => {
    renderTopBar()
    const chatLink = screen.getByText("Chat").closest("a")
    expect(chatLink).toHaveAttribute("aria-current", "page")
  })

  it("renders mobile menu button", () => {
    renderTopBar()
    expect(screen.getByLabelText("Toggle sidebar")).toBeInTheDocument()
  })

  it("calls onMenuToggle when menu button is clicked", async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderTopBar(true, onToggle)

    await user.click(screen.getByLabelText("Toggle sidebar"))
    expect(onToggle).toHaveBeenCalled()
  })

  it("has a spacer div instead of logout button", () => {
    renderTopBar()
    // Logout moved to settings page — top bar has a spacer for layout balance
    expect(screen.queryByText("Logout")).not.toBeInTheDocument()
  })

  it("has navigation landmark", () => {
    renderTopBar()
    expect(screen.getByRole("navigation")).toBeInTheDocument()
  })
})
