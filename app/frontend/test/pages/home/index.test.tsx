import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HomeIndex from "@/pages/home/index"
import { UnreadProvider } from "@/contexts/unread-context"

vi.mock("@inertiajs/react", () => ({
  router: {
    delete: vi.fn(),
    visit: vi.fn(),
  },
  usePage: () => ({ url: "/dashboard" }),
}))

function renderWithProvider(component: React.ReactElement) {
  return render(<UnreadProvider>{component}</UnreadProvider>)
}

vi.mock("@rails/actioncable", () => ({
  createConsumer: () => ({
    subscriptions: {
      create: (_params: unknown, callbacks: Record<string, (...args: unknown[]) => void>) => {
        // Simulate connected state
        setTimeout(() => callbacks.connected?.(), 0)
        return {
          perform: vi.fn(),
          unsubscribe: vi.fn(),
        }
      },
    },
    disconnect: vi.fn(),
  }),
}))

const defaultProps = {
  chat_session_id: 1,
  messages: [
    { id: 1, role: "user", content: "Hello!", created_at: "2026-01-30T00:00:00Z" },
    { id: 2, role: "assistant", content: "Hi there!", created_at: "2026-01-30T00:00:01Z" },
  ],
}

describe("HomeIndex", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the title", () => {
    renderWithProvider(<HomeIndex {...defaultProps} />)
    expect(screen.getByText("DashBot")).toBeInTheDocument()
  })

  it("renders messages", () => {
    renderWithProvider(<HomeIndex {...defaultProps} />)
    expect(screen.getByText("Hello!")).toBeInTheDocument()
    expect(screen.getByText("Hi there!")).toBeInTheDocument()
  })

  it("shows empty state when no messages", () => {
    renderWithProvider(<HomeIndex chat_session_id={1} messages={[]} />)
    expect(screen.getByText("No messages yet. Say something!")).toBeInTheDocument()
  })

  it("has a message input", () => {
    renderWithProvider(<HomeIndex {...defaultProps} />)
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument()
  })

  it("calls router.delete on logout", async () => {
    const user = userEvent.setup()
    const { router } = await import("@inertiajs/react")

    renderWithProvider(<HomeIndex {...defaultProps} />)

    const logoutButton = screen.getByRole("button", { name: /logout/i })
    await user.click(logoutButton)
    expect(router.delete).toHaveBeenCalledWith("/logout")
  })
})
