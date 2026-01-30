import { cn } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    const condition = false
    expect(cn("foo", condition && "bar", "baz")).toBe("foo baz")
  })

  it("deduplicates and merges tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
  })

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("")
  })
})
