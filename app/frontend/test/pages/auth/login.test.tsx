import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Login from "@/pages/auth/login"

describe("Login", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the login form", () => {
    render(<Login token="abc123" />)
    expect(screen.getByText("Enter Password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument()
  })

  it("submits the password to the correct endpoint", async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    )

    render(<Login token="my-token" />)

    await user.type(screen.getByPlaceholderText("Password"), "secret")
    await user.click(screen.getByRole("button", { name: "Login" }))

    expect(fetchSpy).toHaveBeenCalledWith("/login/my-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "secret" }),
    })
  })

  it("shows success view on successful login", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    )

    render(<Login token="abc" />)

    await user.type(screen.getByPlaceholderText("Password"), "pass")
    await user.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(screen.getByText("You're In!")).toBeInTheDocument()
    })
    expect(screen.queryByPlaceholderText("Password")).not.toBeInTheDocument()
  })

  it("displays server error message on failure", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Wrong password" }), { status: 401 })
    )

    render(<Login token="abc" />)

    await user.type(screen.getByPlaceholderText("Password"), "wrong")
    await user.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(screen.getByText("Wrong password")).toBeInTheDocument()
    })
  })

  it("displays generic error when server returns no error message", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 401 })
    )

    render(<Login token="abc" />)

    await user.type(screen.getByPlaceholderText("Password"), "wrong")
    await user.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument()
    })
  })

  it("displays generic error on network failure", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))

    render(<Login token="abc" />)

    await user.type(screen.getByPlaceholderText("Password"), "pass")
    await user.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument()
    })
  })

  it("clears previous error on new submission", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Bad password" }), { status: 401 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      )

    render(<Login token="abc" />)

    await user.type(screen.getByPlaceholderText("Password"), "wrong")
    await user.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(screen.getByText("Bad password")).toBeInTheDocument()
    })

    await user.clear(screen.getByPlaceholderText("Password"))
    await user.type(screen.getByPlaceholderText("Password"), "right")
    await user.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(screen.queryByText("Bad password")).not.toBeInTheDocument()
    })
  })
})
