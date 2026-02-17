import { parseSessionType } from "@/lib/sessions"

// Test the session parsing logic used by useAgentData
// and status widgets/hierarchy views.
describe("parseSessionType", () => {
  it("identifies main sessions", () => {
    expect(parseSessionType("agent:main:main")).toBe("main")
    expect(parseSessionType("agent:garbo:main")).toBe("main")
  })

  it("identifies cron sessions", () => {
    expect(parseSessionType("agent:main:cron:morning-brief")).toBe("cron")
    expect(parseSessionType("cron:job-123")).toBe("cron")
  })

  it("identifies subagent sessions", () => {
    expect(parseSessionType("agent:main:subagent:abc-123")).toBe("subagent")
  })

  it("identifies dashbot sessions", () => {
    expect(parseSessionType("agent:main:dashbot:default")).toBe("dashbot")
  })

  it("identifies channel sessions with provider-prefixed keys", () => {
    expect(parseSessionType("agent:main:discord:channel:1470090683992903841")).toBe("channel")
    expect(parseSessionType("agent:main:telegram:channel:123456")).toBe("channel")
  })

  it("returns unknown for unrecognized formats", () => {
    expect(parseSessionType("something:weird")).toBe("unknown")
    expect(parseSessionType("")).toBe("unknown")
  })
})
