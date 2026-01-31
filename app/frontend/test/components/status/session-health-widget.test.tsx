import { render, screen } from "@testing-library/react"
import SessionHealthWidget from "@/components/status/session-health-widget"

describe("SessionHealthWidget", () => {
  const defaultData = {
    uptime: "2m ago",
    model: "claude-opus-4-5",
    context_percent: 83,
    tokens: "166k/200k",
    session_key: "agent:main:main",
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

  it("renders the widget title", () => {
    render(<SessionHealthWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText("Session Health")).toBeInTheDocument()
  })

  it("displays uptime", () => {
    render(<SessionHealthWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText("2m ago")).toBeInTheDocument()
  })

  it("displays model", () => {
    render(<SessionHealthWidget data={defaultData} sessions={defaultSessions} />)
    // Multiple elements might have the model name; check at least one exists
    expect(screen.getAllByText("claude-opus-4-5").length).toBeGreaterThan(0)
  })

  it("displays context usage", () => {
    render(<SessionHealthWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText("166k/200k (83%)")).toBeInTheDocument()
  })

  it("displays session count header", () => {
    render(<SessionHealthWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText(/All Sessions \(2\)/)).toBeInTheDocument()
  })

  it("lists individual sessions", () => {
    render(<SessionHealthWidget data={defaultData} sessions={defaultSessions} />)
    expect(screen.getByText("claude-haiku-4-5")).toBeInTheDocument()
  })

  it("renders with empty sessions", () => {
    render(<SessionHealthWidget data={defaultData} sessions={[]} />)
    expect(screen.getByText("Session Health")).toBeInTheDocument()
    // Should not show session list header
    expect(screen.queryByText(/All Sessions/)).not.toBeInTheDocument()
  })
})
