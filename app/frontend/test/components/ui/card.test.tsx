import { render, screen } from "@testing-library/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card body</Card>)
    expect(screen.getByText("Card body")).toBeInTheDocument()
  })

  it("sets data-slot=card", () => {
    render(<Card>Content</Card>)
    expect(screen.getByText("Content").closest("[data-slot='card']")).toBeInTheDocument()
  })

  it("merges custom className", () => {
    render(<Card className="w-80" data-testid="card">Content</Card>)
    expect(screen.getByTestId("card")).toHaveClass("w-80")
  })
})

describe("CardHeader", () => {
  it("renders with data-slot=card-header", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>)
    const el = screen.getByTestId("header")
    expect(el).toHaveAttribute("data-slot", "card-header")
    expect(el).toHaveTextContent("Header")
  })
})

describe("CardTitle", () => {
  it("renders with data-slot=card-title", () => {
    render(<CardTitle data-testid="title">Title text</CardTitle>)
    const el = screen.getByTestId("title")
    expect(el).toHaveAttribute("data-slot", "card-title")
    expect(el).toHaveTextContent("Title text")
  })
})

describe("CardDescription", () => {
  it("renders with data-slot=card-description", () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>)
    const el = screen.getByTestId("desc")
    expect(el).toHaveAttribute("data-slot", "card-description")
    expect(el).toHaveTextContent("Description")
  })
})

describe("CardAction", () => {
  it("renders with data-slot=card-action", () => {
    render(<CardAction data-testid="action">Action</CardAction>)
    expect(screen.getByTestId("action")).toHaveAttribute("data-slot", "card-action")
  })
})

describe("CardContent", () => {
  it("renders with data-slot=card-content", () => {
    render(<CardContent data-testid="content">Body</CardContent>)
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "card-content")
  })
})

describe("CardFooter", () => {
  it("renders with data-slot=card-footer", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>)
    expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "card-footer")
  })
})

describe("Card composition", () => {
  it("renders a full card with all subcomponents", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )

    const card = screen.getByTestId("card")
    expect(card).toHaveTextContent("Title")
    expect(card).toHaveTextContent("Description")
    expect(card).toHaveTextContent("Action")
    expect(card).toHaveTextContent("Content")
    expect(card).toHaveTextContent("Footer")
  })
})
