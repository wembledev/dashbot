import { parseSessionType } from "@/lib/sessions"

// Test the session parsing logic used by useAgentData
describe("parseSessionType", () => {
  it("identifies main sessions", () => {
    expect(parseSessionType("agent:main:main")).toBe("main")
    expect(parseSessionType("agent:garbo:main")).toBe("main")
  })

  it("identifies cron sessions", () => {
    expect(parseSessionType("agent:main:cron:morning-brief")).toBe("cron")
    expect(parseSessionType("agent:main:cron:evening-wrap-up")).toBe("cron")
  })

  it("identifies subagent sessions", () => {
    expect(parseSessionType("agent:main:subagent:abc-123")).toBe("subagent")
  })

  it("identifies dashbot channel", () => {
    expect(parseSessionType("agent:main:channel:dashbot")).toBe("dashbot")
  })

  it("identifies other channels", () => {
    expect(parseSessionType("agent:main:channel:discord")).toBe("channel")
    expect(parseSessionType("agent:main:channel:telegram")).toBe("channel")
  })

  it("returns unknown for unrecognized formats", () => {
    expect(parseSessionType("something:weird")).toBe("unknown")
    expect(parseSessionType("")).toBe("unknown")
  })
})
