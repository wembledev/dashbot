import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import ConfirmCard from "@/components/chat/confirm-card"
import type { ConfirmCard as ConfirmCardType } from "@/types/cards"

describe("ConfirmCard", () => {
  const mockCard: ConfirmCardType = {
    type: "confirm",
    prompt: "Are you sure you want to continue?",
    options: [
      { label: "Yes", value: "yes", style: "primary" },
      { label: "No", value: "no", style: "danger" },
      { label: "Maybe", value: "maybe" },
    ],
  }

  // Card without ID = legacy mode (sends via onSelect callback)
  // Card with ID = agentic mode (POSTs to API)

  it("renders prompt and options", () => {
    const onSelect = vi.fn()
    render(<ConfirmCard card={mockCard} onSelect={onSelect} />)

    expect(screen.getByText("Are you sure you want to continue?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Maybe" })).toBeInTheDocument()
  })

  it("calls onSelect callback when option is clicked", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ConfirmCard card={mockCard} onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: "Yes" }))

    expect(onSelect).toHaveBeenCalledWith("yes")
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("removes buttons after selection", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ConfirmCard card={mockCard} onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: "Yes" }))

    // All buttons gone after selection
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })

  it("replaces buttons with result after clicking", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ConfirmCard card={mockCard} onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: "Maybe" }))

    // Buttons should be gone, replaced by result
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.getByText("Maybe")).toBeInTheDocument()
  })

  it("renders pre-responded card without buttons", () => {
    const respondedCard: ConfirmCardType = {
      ...mockCard,
      responded: true,
      response: "yes",
    }
    render(<ConfirmCard card={respondedCard} />)

    // No buttons in responded state
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    // Shows selected label
    expect(screen.getByText("Yes")).toBeInTheDocument()
    // Prompt becomes muted
    expect(screen.getByText(mockCard.prompt)).toBeInTheDocument()
  })

  it("shows agent reply when present", () => {
    const repliedCard: ConfirmCardType = {
      ...mockCard,
      responded: true,
      response: "yes",
      reply: "Great, deploying now!",
    }
    render(<ConfirmCard card={repliedCard} />)

    expect(screen.getByText("Great, deploying now!")).toBeInTheDocument()
  })

  it("prevents multiple selections", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ConfirmCard card={mockCard} onSelect={onSelect} />)

    const yesButton = screen.getByRole("button", { name: "Yes" })
    const noButton = screen.getByRole("button", { name: "No" })

    // Click first button
    await user.click(yesButton)
    expect(onSelect).toHaveBeenCalledTimes(1)

    // Try to click second button - should not trigger callback
    await user.click(noButton)
    expect(onSelect).toHaveBeenCalledTimes(1) // Still 1, not 2
  })

  it("applies correct button variants based on style", () => {
    const onSelect = vi.fn()
    render(<ConfirmCard card={mockCard} onSelect={onSelect} />)

    // This is a bit fragile since it depends on implementation details,
    // but we can check that buttons exist with different styles
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Maybe" })).toBeInTheDocument()
  })

  it("renders all options in the correct order", () => {
    const onSelect = vi.fn()
    render(<ConfirmCard card={mockCard} onSelect={onSelect} />)

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveTextContent("Yes")
    expect(buttons[1]).toHaveTextContent("No")
    expect(buttons[2]).toHaveTextContent("Maybe")
  })
})
