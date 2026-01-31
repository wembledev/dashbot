import { render, screen, renderHook, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { UnreadProvider, useUnread } from "@/contexts/unread-context"

describe("UnreadContext", () => {
  it("initial count is 0", () => {
    const { result } = renderHook(() => useUnread(), {
      wrapper: UnreadProvider,
    })

    expect(result.current.unreadCount).toBe(0)
  })

  it("incrementUnread increases count", () => {
    const { result } = renderHook(() => useUnread(), {
      wrapper: UnreadProvider,
    })

    act(() => {
      result.current.incrementUnread()
    })

    expect(result.current.unreadCount).toBe(1)

    act(() => {
      result.current.incrementUnread()
    })

    expect(result.current.unreadCount).toBe(2)
  })

  it("clearUnread resets to 0", () => {
    const { result } = renderHook(() => useUnread(), {
      wrapper: UnreadProvider,
    })

    // Increment a few times
    act(() => {
      result.current.incrementUnread()
      result.current.incrementUnread()
      result.current.incrementUnread()
    })

    expect(result.current.unreadCount).toBe(3)

    // Clear
    act(() => {
      result.current.clearUnread()
    })

    expect(result.current.unreadCount).toBe(0)
  })

  it("throws error when useUnread is used outside provider", () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = () => {}

    expect(() => {
      renderHook(() => useUnread())
    }).toThrow("useUnread must be used within UnreadProvider")

    console.error = originalError
  })

  it("provides context to children", () => {
    function TestComponent() {
      const { unreadCount, incrementUnread } = useUnread()
      return (
        <div>
          <span data-testid="count">{unreadCount}</span>
          <button onClick={incrementUnread}>Increment</button>
        </div>
      )
    }

    render(
      <UnreadProvider>
        <TestComponent />
      </UnreadProvider>
    )

    expect(screen.getByTestId("count")).toHaveTextContent("0")
  })

  it("multiple increments work correctly", () => {
    const { result } = renderHook(() => useUnread(), {
      wrapper: UnreadProvider,
    })

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.incrementUnread()
      }
    })

    expect(result.current.unreadCount).toBe(10)
  })

  it("clearUnread after increment resets properly", () => {
    const { result } = renderHook(() => useUnread(), {
      wrapper: UnreadProvider,
    })

    act(() => {
      result.current.incrementUnread()
      result.current.incrementUnread()
      result.current.clearUnread()
      result.current.incrementUnread()
    })

    expect(result.current.unreadCount).toBe(1)
  })
})
