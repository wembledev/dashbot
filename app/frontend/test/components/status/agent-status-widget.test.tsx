import { render, screen } from "@testing-library/react"
import AgentStatusWidget from "@/components/status/agent-status-widget"

describe("AgentStatusWidget", () => {
  const runningData = {
    running: true,
    session_count: 5,
    main_session_age: "2m ago",
    main_model: "claude-opus-4-5",
  }

  const stoppedData = {
    running: false,
    session_count: 0,
    main_session_age: "unknown",
    main_model: "unknown",
  }

  const emptyEvents: never[] = []

  it("renders the widget title", () => {
    render(<AgentStatusWidget data={runningData} events={emptyEvents} />)
    expect(screen.getByText("Agent Status")).toBeInTheDocument()
  })

  it("shows Running when agent is running", () => {
    render(<AgentStatusWidget data={runningData} events={emptyEvents} />)
    expect(screen.getByText("Running")).toBeInTheDocument()
  })

  it("shows Stopped when agent is not running", () => {
    render(<AgentStatusWidget data={stoppedData} events={emptyEvents} />)
    expect(screen.getByText("Stopped")).toBeInTheDocument()
  })

  it("displays session count", () => {
    render(<AgentStatusWidget data={runningData} events={emptyEvents} />)
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("displays the model name", () => {
    render(<AgentStatusWidget data={runningData} events={emptyEvents} />)
    expect(screen.getByText("claude-opus-4-5")).toBeInTheDocument()
  })

  it("displays last active time", () => {
    render(<AgentStatusWidget data={runningData} events={emptyEvents} />)
    expect(screen.getByText("2m ago")).toBeInTheDocument()
  })

  it("shows green dot when running", () => {
    render(<AgentStatusWidget data={runningData} events={emptyEvents} />)
    expect(screen.getByLabelText("running")).toBeInTheDocument()
  })

  it("shows red dot when stopped", () => {
    render(<AgentStatusWidget data={stoppedData} events={emptyEvents} />)
    expect(screen.getByLabelText("stopped")).toBeInTheDocument()
  })
})
