# Scaffold Inertia Page

user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <folder/page_name>

## Description

Scaffolds a full Inertia.js page with Rails controller, route, and tests. The argument is the page path (e.g., `settings/index`, `chat/show`).

## Steps

Given an argument like `settings/index`:

1. **React page component** at `app/frontend/pages/settings/index.tsx`
2. **Rails controller** at `app/controllers/settings_controller.rb` with the action rendering the Inertia page
3. **Route** added to `config/routes.rb`
4. **Integration test** at `test/integration/settings_test.rb`
5. **Frontend test** at `app/frontend/test/pages/settings/index.test.tsx`

## Templates

### React Page Component

Follow this exact pattern from the existing `home/index` page:

```tsx
// app/frontend/pages/<folder>/<page>.tsx

interface Props {
  // Add props here
}

export default function <PascalName>({ }: Props) {
  return (
    <div className="min-h-screen bg-dashbot-bg text-dashbot-text flex items-center justify-center">
      <h1><Human-readable name></h1>
    </div>
  )
}
```

- Default export, PascalCase function name derived from folder + page (e.g., `settings/index` → `SettingsIndex`)
- `interface Props` always defined at top
- Use `@/` alias for imports (e.g., `@/components/ui/button`)

### Rails Controller

Follow this exact pattern from `HomeController`:

```ruby
# frozen_string_literal: true

class <Name>Controller < ApplicationController
  def <action>
    render inertia: "<folder>/<page>"
  end
end
```

- `frozen_string_literal: true` header
- Inherits `ApplicationController` (which includes the `Authentication` concern)
- Action name matches the page name (e.g., `index`, `show`)

### Route

Add to `config/routes.rb` following the existing pattern. Read the file first and add the route in the appropriate section:

```ruby
get "<path>", to: "<controller>#<action>", as: :<route_name>
```

### Integration Test

Follow this exact pattern from `test/integration/home_test.rb`:

```ruby
# frozen_string_literal: true

require "test_helper"

class <Name>Test < ActionDispatch::IntegrationTest
  test "GET /<path> renders Inertia page when authenticated" do
    sign_in_as(users(:admin))
    get <route_helper>_path
    assert_response :success

    match = response.body.match(%r{<script[^>]*data-page[^>]*>(.+?)</script>}m)
    assert match, "Expected Inertia page data in response body"

    page = JSON.parse(match[1])
    assert_equal "<folder>/<page>", page["component"]
  end

  test "GET /<path> redirects to login when not authenticated" do
    get <route_helper>_path
    assert_redirected_to login_path
  end
end
```

### Frontend Test

Follow this exact pattern from `app/frontend/test/pages/home/index.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import <ComponentName> from "@/pages/<folder>/<page>"

describe("<ComponentName>", () => {
  it("renders without crashing", () => {
    render(<<ComponentName> />)
    expect(screen.getByText("<expected text>")).toBeInTheDocument()
  })
})
```

- Use `@/` path alias for imports
- `vi`, `describe`, `it`, `expect` are globals (no imports needed)
- Use `@testing-library/react` for rendering
- Mock `@inertiajs/react` if the component uses `router`:
  ```tsx
  vi.mock("@inertiajs/react", () => ({
    router: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  }))
  ```

## Notes

- Parse the argument to extract folder and page name (e.g., `settings/index` → folder: `settings`, page: `index`)
- Use PascalCase for component names: `settings/index` → `SettingsIndex`
- Use snake_case for Ruby files: `settings_controller.rb`
- Always read `config/routes.rb` before editing to place the route correctly
- All Ruby files must have `frozen_string_literal: true`
