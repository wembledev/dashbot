import { render, screen } from "@testing-library/react"
import TokenBurnWidget from "@/components/status/token-burn-widget"

describe("TokenBurnWidget", () => {
  const defaultData = {
    main_tokens: "166k/200k",
    main_context_percent: 83,
    total_sessions: 5,
    model: "claude-opus-4-5",
  }

  const defaultSessions = [
    {
      key: "agent:main:main",
      kind: "direct",
      model: "claude-opus-4-5",
      tokens: "166k/200k",
      context_percent: 83,
      age: "2m ago",
      flags: "system",
    },
    {
      key: "agent:main:cron:morning",
      kind: "direct",
      model: "claude-haiku-4-5",
      tokens: "21k/200k",
      context_percent: 10,
      age: "3h ago",
      flags: "system",
    },
  ]

  const lowUsageData = {
    main_tokens: "20k/200k",
    main_context_percent: 10,
    total_sessions: 2,
    model: "claude-haiku-4-5",
  }

  it("renders the widget title", () => {
    render(<TokenBurnWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText("Live Token Burn")).toBeInTheDocument()
  })

  it("displays per-session tokens with friendly labels", () => {
    render(<TokenBurnWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText("Main")).toBeInTheDocument()
    expect(screen.getByText("Cron")).toBeInTheDocument()
    expect(screen.getByText("166k/200k")).toBeInTheDocument()
    expect(screen.getByText("21k/200k")).toBeInTheDocument()
  })

  it("displays context percentage", () => {
    render(<TokenBurnWidget data={defaultData} sessions={defaultSessions} />)
    // 83% appears in context bar and in session row
    expect(screen.getAllByText("83%").length).toBeGreaterThanOrEqual(1)
  })

  it("displays sessions count header", () => {
    render(<TokenBurnWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText(/Sessions \(2\)/)).toBeInTheDocument()
  })

  it("displays the model", () => {
    render(<TokenBurnWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText("claude-opus-4-5")).toBeInTheDocument()
  })

  it("has a progress bar with correct aria attributes", () => {
    render(<TokenBurnWidget data={defaultData} sessions={defaultSessions} />)
    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toHaveAttribute("aria-valuenow", "83")
  })

  it("renders with low usage data and no sessions", () => {
    render(<TokenBurnWidget data={lowUsageData} />)
    expect(screen.getByText("10%")).toBeInTheDocument()
    expect(screen.getByText("claude-haiku-4-5")).toBeInTheDocument()
    // No session breakdown when sessions prop is omitted
    expect(screen.queryByText(/Sessions/)).not.toBeInTheDocument()
  })
})
