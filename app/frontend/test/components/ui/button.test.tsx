import { render, screen } from "@testing-library/react"
import { Button, buttonVariants } from "@/components/ui/button"

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("sets data-slot attribute", () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button")
  })

  it("sets data-variant and data-size attributes", () => {
    render(<Button variant="destructive" size="lg">Test</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("data-variant", "destructive")
    expect(button).toHaveAttribute("data-size", "lg")
  })

  it("defaults to variant=default and size=default", () => {
    render(<Button>Test</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("data-variant", "default")
    expect(button).toHaveAttribute("data-size", "default")
  })

  it("merges custom className", () => {
    render(<Button className="custom-class">Test</Button>)
    expect(screen.getByRole("button")).toHaveClass("custom-class")
  })

  it("passes through HTML button props", () => {
    render(<Button type="submit" disabled>Test</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("type", "submit")
    expect(button).toBeDisabled()
  })

  it("renders as a Slot when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/link">Link</a>
      </Button>
    )
    const link = screen.getByRole("link", { name: "Link" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/link")
    expect(link).toHaveAttribute("data-slot", "button")
  })
})

describe("buttonVariants", () => {
  it("returns a string of class names", () => {
    const classes = buttonVariants({ variant: "default", size: "default" })
    expect(typeof classes).toBe("string")
    expect(classes.length).toBeGreaterThan(0)
  })

  it("includes variant-specific classes", () => {
    const destructive = buttonVariants({ variant: "destructive" })
    expect(destructive).toContain("bg-destructive")

    const outline = buttonVariants({ variant: "outline" })
    expect(outline).toContain("border")
  })
})
