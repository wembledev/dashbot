import { render, screen } from "@testing-library/react"
import TasksWidget from "@/components/status/tasks-widget"

describe("TasksWidget", () => {
  const defaultData = {
    cron_jobs: [
      {
        id: "1",
        name: "Morning briefing",
        schedule: "cron 0 7 * * *",
        next_run: "in 11h",
        last_run: "13h ago",
        status: "ok",
        target: "isolated",
        agent: "default",
      },
      {
        id: "2",
        name: "Session health check",
        schedule: "cron */30 * * * *",
        next_run: "in 12m",
        last_run: "18m ago",
        status: "skipped",
        target: "main",
        agent: "default",
      },
      {
        id: "3",
        name: "Evening wrap-up",
        schedule: "cron 0 18 * * *",
        next_run: "in 22h",
        last_run: "2h ago",
        status: "idle",
        target: "isolated",
        agent: "default",
      },
    ],
    pending_count: 1,
    next_job: "Session health check",
    cron_health: "healthy" as const,
    cron_errors: [],
  }

  const emptyData = {
    cron_jobs: [],
    pending_count: 0,
    next_job: null,
    cron_health: "healthy" as const,
    cron_errors: [],
  }

  it("renders the widget title", () => {
    render(<TasksWidget data={defaultData} />)
    expect(screen.getByText("Scheduled Tasks")).toBeInTheDocument()
  })

  it("displays cron job count", () => {
    render(<TasksWidget data={defaultData} />)
    expect(screen.getByText("3 cron jobs configured")).toBeInTheDocument()
  })

  it("displays cron job names", () => {
    render(<TasksWidget data={defaultData} />)
    expect(screen.getByText("Morning briefing")).toBeInTheDocument()
    // "Session health check" appears in both the list and footer, so use getAllByText
    expect(screen.getAllByText("Session health check").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Evening wrap-up")).toBeInTheDocument()
  })

  it("displays next run times", () => {
    render(<TasksWidget data={defaultData} />)
    expect(screen.getByText("in 11h")).toBeInTheDocument()
    expect(screen.getByText("in 12m")).toBeInTheDocument()
  })

  it("displays next job footer", () => {
    render(<TasksWidget data={defaultData} />)
    // Appears in both list item and footer
    const matches = screen.getAllByText("Session health check")
    expect(matches.length).toBe(2) // once in list, once in footer
  })

  it("shows empty state when no cron jobs", () => {
    render(<TasksWidget data={emptyData} />)
    expect(screen.getByText("No cron jobs configured")).toBeInTheDocument()
  })
})
