import { render, screen } from "@testing-library/react"
import TokenBurnWidget from "@/components/status/token-burn-widget"

describe("TokenBurnWidget", () => {
  const defaultData = {
    main_tokens: "166k/200k",
    main_context_percent: 83,
    total_sessions: 5,
    model: "claude-opus-4-5",
  }

  const lowUsageData = {
    main_tokens: "20k/200k",
    main_context_percent: 10,
    total_sessions: 2,
    model: "claude-haiku-4-5",
  }

  it("renders the widget title", () => {
    render(<TokenBurnWidget data={defaultData} />)
    expect(screen.getByText("Live Token Burn")).toBeInTheDocument()
  })

  it("displays main token count", () => {
    render(<TokenBurnWidget data={defaultData} />)
    expect(screen.getByText("166k/200k")).toBeInTheDocument()
  })

  it("displays context percentage", () => {
    render(<TokenBurnWidget data={defaultData} />)
    expect(screen.getByText("83%")).toBeInTheDocument()
  })

  it("displays total sessions", () => {
    render(<TokenBurnWidget data={defaultData} />)
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("displays the model", () => {
    render(<TokenBurnWidget data={defaultData} />)
    expect(screen.getByText("claude-opus-4-5")).toBeInTheDocument()
  })

  it("has a progress bar with correct aria attributes", () => {
    render(<TokenBurnWidget data={defaultData} />)
    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toHaveAttribute("aria-valuenow", "83")
  })

  it("renders with low usage data", () => {
    render(<TokenBurnWidget data={lowUsageData} />)
    expect(screen.getByText("10%")).toBeInTheDocument()
    expect(screen.getByText("claude-haiku-4-5")).toBeInTheDocument()
  })
})
