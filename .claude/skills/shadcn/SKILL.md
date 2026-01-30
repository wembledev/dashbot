# Add shadcn/ui Component

user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <component-name>

## Description

Installs a shadcn/ui component and scaffolds a Vitest test for it. The argument is the component name (e.g., `badge`, `dialog`, `input`).

## Steps

1. **Install the component** by running:
   ```
   npx shadcn@latest add <name>
   ```

2. **Read the installed component** at `app/frontend/components/ui/<name>.tsx` to understand its exports, props, and `data-slot` value.

3. **Create a Vitest test** at `app/frontend/test/components/ui/<name>.test.tsx`.

## Test Template

Follow this exact pattern from the existing `button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { <Component> } from "@/components/ui/<name>"

describe("<Component>", () => {
  it("renders with children", () => {
    render(<<Component>>Test content</<Component>>)
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("sets data-slot attribute", () => {
    render(<<Component>>Test</<Component>>)
    // Use appropriate query for the element
    expect(<element>).toHaveAttribute("data-slot", "<slot-name>")
  })

  it("merges custom className", () => {
    render(<<Component> className="custom-class">Test</<Component>>)
    expect(<element>).toHaveClass("custom-class")
  })

  it("passes through HTML props", () => {
    render(<<Component> data-testid="custom">Test</<Component>>)
    expect(screen.getByTestId("custom")).toBeInTheDocument()
  })
})
```

### Key Testing Patterns

- `vi`, `describe`, `it`, `expect` are globals (no imports needed)
- Use `@/` path alias for component imports
- Always test `data-slot` attribute (all shadcn/ui components have one)
- Always test `className` merging via `cn()`
- Always test HTML prop passthrough
- For components with variants, test `data-variant` and `data-size` attributes
- For compound components (e.g., `Card` with `CardHeader`, `CardTitle`), test each sub-component's `data-slot`
- Use `@testing-library/react` for rendering and queries
- Use `userEvent.setup()` for interaction tests:
  ```tsx
  import userEvent from "@testing-library/user-event"
  const user = userEvent.setup()
  await user.click(element)
  ```

## Notes

- Read the installed component source to determine the correct `data-slot` value, exported names, and prop types
- If the component is a compound component (multiple exports), write tests for each exported sub-component
- Match the existing test style in `app/frontend/test/components/ui/button.test.tsx`
