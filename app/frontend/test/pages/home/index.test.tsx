import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HomeIndex from "@/pages/home/index"

vi.mock("@inertiajs/react", () => ({
  router: {
    delete: vi.fn(),
  },
}))

describe("HomeIndex", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the title", () => {
    render(<HomeIndex />)
    expect(screen.getByText("Dashbot")).toBeInTheDocument()
  })

  it("renders all tech stack items", () => {
    render(<HomeIndex />)
    for (const name of ["Rails", "Inertia", "React", "TypeScript", "Tailwind v4", "shadcn/ui"]) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it("starts with the first vibe label", () => {
    render(<HomeIndex />)
    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument()
  })

  it("cycles through vibes on click", async () => {
    const user = userEvent.setup()
    render(<HomeIndex />)

    const vibeButton = screen.getByRole("button", { name: "Get Started" })
    await user.click(vibeButton)
    expect(screen.getByRole("button", { name: "Cosmic" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cosmic" }))
    expect(screen.getByRole("button", { name: "Matrix" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Matrix" }))
    expect(screen.getByRole("button", { name: "Ember" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Ember" }))
    expect(screen.getByRole("button", { name: "Deep Sea" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Deep Sea" }))
    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument()
  })

  it("calls router.delete on logout", async () => {
    const user = userEvent.setup()
    const { router } = await import("@inertiajs/react")

    render(<HomeIndex />)

    await user.click(screen.getByRole("button", { name: "Logout" }))
    expect(router.delete).toHaveBeenCalledWith("/logout")
  })
})
