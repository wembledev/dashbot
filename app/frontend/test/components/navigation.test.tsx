import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import Navigation from "@/components/navigation"
import { UnreadProvider, useUnread } from "@/contexts/unread-context"

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

describe("Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the DashBot logo", () => {
    renderWithProvider(<Navigation />)
    expect(screen.getByText("DashBot")).toBeInTheDocument()
  })

  it("renders Chats nav item", () => {
    renderWithProvider(<Navigation />)
    expect(screen.getByRole("button", { name: /chats/i })).toBeInTheDocument()
  })

  it("renders Status nav item", () => {
    renderWithProvider(<Navigation />)
    expect(screen.getByRole("button", { name: /status/i })).toBeInTheDocument()
  })

  it("renders logout button", () => {
    renderWithProvider(<Navigation />)
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument()
  })

  it("navigates to status page when Status is clicked", async () => {
    const user = userEvent.setup()
    const { router } = await import("@inertiajs/react")
    renderWithProvider(<Navigation />)

    await user.click(screen.getByRole("button", { name: /status/i }))
    expect(router.visit).toHaveBeenCalledWith("/status")
  })

  it("navigates to chats page when Chats is clicked", async () => {
    const user = userEvent.setup()
    const { router } = await import("@inertiajs/react")
    renderWithProvider(<Navigation />)

    await user.click(screen.getByRole("button", { name: /chats/i }))
    expect(router.visit).toHaveBeenCalledWith("/dashboard")
  })

  it("calls router.delete on logout click", async () => {
    const user = userEvent.setup()
    const { router } = await import("@inertiajs/react")
    renderWithProvider(<Navigation />)

    await user.click(screen.getByRole("button", { name: /logout/i }))
    expect(router.delete).toHaveBeenCalledWith("/logout")
  })

  it("marks Chats as active when on /dashboard", () => {
    renderWithProvider(<Navigation />)
    const chatsButton = screen.getByRole("button", { name: /chats/i })
    expect(chatsButton).toHaveAttribute("aria-current", "page")
  })

  it("has navigation landmark", () => {
    renderWithProvider(<Navigation />)
    expect(screen.getByRole("navigation")).toBeInTheDocument()
  })

  it("shows unread badge when count > 0", () => {
    render(
      <UnreadProvider>
        <TestNavigationWithUnread count={5} />
      </UnreadProvider>
    )

    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("hides badge when count is 0", () => {
    renderWithProvider(<Navigation />)

    // Should not show badge with 0 count
    expect(screen.queryByText("0")).not.toBeInTheDocument()
  })

  it("shows 99+ for counts over 99", () => {
    render(
      <UnreadProvider>
        <TestNavigationWithUnread count={150} />
      </UnreadProvider>
    )

    expect(screen.getByText("99+")).toBeInTheDocument()
  })

  it("renders connected dot when connected prop is true", () => {
    renderWithProvider(<Navigation connected={true} />)

    const dot = screen.getByLabelText("Connected")
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveClass("bg-green-500")
  })

  it("renders disconnected dot when connected prop is false", () => {
    renderWithProvider(<Navigation connected={false} />)

    const dot = screen.getByLabelText("Disconnected")
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveClass("bg-red-500")
  })

  it("does not render connection dot when connected prop is undefined", () => {
    renderWithProvider(<Navigation />)

    expect(screen.queryByLabelText("Connected")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Disconnected")).not.toBeInTheDocument()
  })
})

// Helper component to test with specific unread count
function TestNavigationWithUnread({ count }: { count: number }) {
  const { incrementUnread } = useUnread()
  const [initialized, setInitialized] = React.useState(false)

  React.useEffect(() => {
    if (!initialized) {
      for (let i = 0; i < count; i++) {
        incrementUnread()
      }
      setInitialized(true)
    }
  }, [initialized, count, incrementUnread])

  return <Navigation />
}
