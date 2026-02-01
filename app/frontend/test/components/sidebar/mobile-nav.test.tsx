import { render, screen } from "@testing-library/react"
import MobileNav from "@/components/sidebar/MobileNav"
import { UnreadProvider } from "@/contexts/unread-context"

vi.mock("@inertiajs/react", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
  usePage: () => ({ url: "/status" }),
}))

function renderMobileNav() {
  return render(
    <UnreadProvider>
      <MobileNav />
    </UnreadProvider>
  )
}

describe("MobileNav", () => {
  it("renders all tab labels", () => {
    renderMobileNav()
    expect(screen.getByText("Chat")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("marks the active tab", () => {
    renderMobileNav()
    const statusLink = screen.getByText("Status").closest("a")
    expect(statusLink).toHaveAttribute("aria-current", "page")
  })

  it("does not mark inactive tabs", () => {
    renderMobileNav()
    const chatLink = screen.getByText("Chat").closest("a")
    expect(chatLink).not.toHaveAttribute("aria-current")
  })

  it("has correct hrefs", () => {
    renderMobileNav()
    expect(screen.getByText("Chat").closest("a")).toHaveAttribute("href", "/dashboard")
    expect(screen.getByText("Status").closest("a")).toHaveAttribute("href", "/status")
    expect(screen.getByText("Settings").closest("a")).toHaveAttribute("href", "/settings")
  })
})
