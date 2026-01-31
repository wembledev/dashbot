import { render, screen } from "@testing-library/react"
import MemoryWidget from "@/components/status/memory-widget"

const sharedDefaults = {
  chunk_count: 0,
  dirty: false,
  sources: "",
  vector_ready: false,
  fts_ready: false,
  cache_count: 0,
}

describe("MemoryWidget (QMD backend)", () => {
  const qmdData = {
    backend: "qmd" as const,
    file_count: 104,
    vector_count: 558,
    index_size: "6.3 MB",
    updated: "2h ago",
    collections: [
      { name: "memory", pattern: "**/*.md", files: 104, updated: "2h ago" },
    ],
    ...sharedDefaults,
  }

  it("renders QMD title", () => {
    render(<MemoryWidget data={qmdData} />)
    expect(screen.getByText("Memory (QMD)")).toBeInTheDocument()
  })

  it("displays file count and vectors", () => {
    render(<MemoryWidget data={qmdData} />)
    expect(screen.getByText("104")).toBeInTheDocument()
    expect(screen.getByText("558")).toBeInTheDocument()
  })

  it("displays index size", () => {
    render(<MemoryWidget data={qmdData} />)
    expect(screen.getByText("6.3 MB")).toBeInTheDocument()
  })

  it("renders collections", () => {
    render(<MemoryWidget data={qmdData} />)
    expect(screen.getByText("memory")).toBeInTheDocument()
    expect(screen.getByText("**/*.md")).toBeInTheDocument()
    expect(screen.getByText(/104 files/)).toBeInTheDocument()
  })
})

describe("MemoryWidget (OpenClaw backend)", () => {
  const openclawData = {
    backend: "openclaw" as const,
    file_count: 4,
    vector_count: 0,
    index_size: "",
    updated: "",
    collections: [],
    chunk_count: 12,
    dirty: false,
    sources: "memory, sessions",
    vector_ready: true,
    fts_ready: true,
    cache_count: 14,
  }

  it("renders OpenClaw title", () => {
    render(<MemoryWidget data={openclawData} />)
    expect(screen.getByText("Memory State")).toBeInTheDocument()
  })

  it("displays file and chunk count", () => {
    render(<MemoryWidget data={openclawData} />)
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
  })

  it("shows Clean sync status", () => {
    render(<MemoryWidget data={openclawData} />)
    expect(screen.getByText("Clean")).toBeInTheDocument()
  })

  it("shows Dirty when dirty", () => {
    render(<MemoryWidget data={{ ...openclawData, dirty: true }} />)
    expect(screen.getByText("Dirty")).toBeInTheDocument()
  })

  it("shows search readiness", () => {
    render(<MemoryWidget data={openclawData} />)
    const readyElements = screen.getAllByText("Ready")
    expect(readyElements.length).toBe(2)
  })

  it("shows sources and cache", () => {
    render(<MemoryWidget data={openclawData} />)
    expect(screen.getByText("memory, sessions")).toBeInTheDocument()
    expect(screen.getByText("14")).toBeInTheDocument()
  })
})
