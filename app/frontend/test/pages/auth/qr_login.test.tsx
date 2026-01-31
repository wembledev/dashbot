import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import QrLogin from "@/pages/auth/qr_login"

const qrResponse = {
  qr_data: "data:image/png;base64,abc",
  token: "tok-123",
  login_url: "/login/tok-123",
}

describe("QrLogin", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows loading state then QR image after fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(qrResponse), { status: 200 })
    )

    render(<QrLogin />)

    expect(screen.getByText("Generating...")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByAltText("Login QR Code")).toBeInTheDocument()
    })

    expect(screen.getByAltText("Login QR Code")).toHaveAttribute(
      "src",
      "data:image/png;base64,abc"
    )
  })

  it("renders the title and description", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(qrResponse), { status: 200 })
    )

    render(<QrLogin />)

    expect(screen.getByText("DashBot")).toBeInTheDocument()
    expect(screen.getByText("Scan with your phone to login")).toBeInTheDocument()

    // Wait for async state updates to settle
    await waitFor(() => {
      expect(screen.getByAltText("Login QR Code")).toBeInTheDocument()
    })
  })

  it("shows Dev Login link when login_url is returned", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(qrResponse), { status: 200 })
    )

    render(<QrLogin />)

    await waitFor(() => {
      expect(screen.getByText("Dev Login")).toBeInTheDocument()
    })

    const link = screen.getByText("Dev Login").closest("a")
    expect(link).toHaveAttribute("href", "/login/tok-123")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("does not show Dev Login link when login_url is absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ qr_data: "data:image/png;base64,abc", token: "tok" }),
        { status: 200 }
      )
    )

    render(<QrLogin />)

    await waitFor(() => {
      expect(screen.getByAltText("Login QR Code")).toBeInTheDocument()
    })

    expect(screen.queryByText("Dev Login")).not.toBeInTheDocument()
  })

  it("refreshes QR code when Refresh QR is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(qrResponse), { status: 200 }))
    )

    render(<QrLogin />)

    await waitFor(() => {
      expect(screen.getByAltText("Login QR Code")).toBeInTheDocument()
    })

    expect(fetchSpy).toHaveBeenCalledWith("/qr")

    await user.click(screen.getByRole("button", { name: "Refresh QR" }))

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenLastCalledWith("/qr")
  })

  it("polls status endpoint and redirects on login", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(qrResponse), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ logged_in: false }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ logged_in: true }), { status: 200 })
      )

    // Capture redirect via defineProperty on window.location
    let redirectUrl = ""
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "location")!
    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "" },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window.location, "href", {
      set(url: string) { redirectUrl = url },
      get() { return "" },
      configurable: true,
    })

    render(<QrLogin />)

    // Wait for initial QR fetch
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/qr")
    })

    // Advance past first poll interval
    await vi.advanceTimersByTimeAsync(2000)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/qr/tok-123/status")
    })

    // Advance past second poll interval
    await vi.advanceTimersByTimeAsync(2000)

    await waitFor(() => {
      expect(redirectUrl).toBe("/dashboard")
    })

    Object.defineProperty(window, "location", originalDescriptor)
  })
})
