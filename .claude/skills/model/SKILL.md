# Scaffold Rails Model

user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <name> <field:type ...>

## Description

Generates a Rails model with migration, fixtures, and tests. The first argument is the model name, followed by field definitions (e.g., `widget name:string weight:integer`).

## Steps

1. **Generate the model** by running:
   ```
   bin/rails generate model <name> <fields...>
   ```

2. **Run the migration**:
   ```
   bin/rails db:migrate
   ```

3. **Add fixture entries** in `test/fixtures/<plural_name>.yml`

4. **Update the model test** at `test/models/<name>_test.rb`

## Templates

### Fixtures

Follow the existing pattern from `test/fixtures/users.yml`. Create 2-3 meaningful fixture entries:

```yaml
# test/fixtures/<plural_name>.yml
one:
  <field>: <sensible default value>
  <field>: <sensible default value>

two:
  <field>: <sensible default value>
  <field>: <sensible default value>
```

- Use descriptive fixture names when possible (not just `one`/`two`)
- Use ERB for dynamic values: `<%= Time.current %>`, `<%= BCrypt::Password.create("pass") %>`
- For references/belongs_to, use fixture names: `user: admin`
- Ensure fixture values are valid and internally consistent

### Model Test

Follow this exact pattern from `test/models/user_test.rb`:

```ruby
# frozen_string_literal: true

require "test_helper"

class <ModelName>Test < ActiveSupport::TestCase
  test "fixture is valid" do
    <model> = <plural>(:one)
    assert <model>.valid?
  end

  # Add tests for:
  # - Validations (presence, uniqueness, format, etc.)
  # - Associations (has_many, belongs_to, etc.)
  # - Custom methods
  # - Scopes
end
```

### Key Patterns

- `frozen_string_literal: true` on all Ruby files
- `require "test_helper"` at top of test files
- Access fixtures by name: `widgets(:one)`, `users(:admin)`
- `fixtures :all` is loaded globally — no need to declare fixtures in tests
- Test class inherits `ActiveSupport::TestCase`
- Use `assert`, `assert_equal`, `assert_not`, `assert_respond_to`, `assert_includes`, `assert_difference`

## Notes

- The model name should be singular (e.g., `widget`, not `widgets`)
- Field types: `string`, `text`, `integer`, `float`, `decimal`, `boolean`, `date`, `datetime`, `references`
- For `references` fields, the generator creates `belongs_to` automatically
- After generation, review the model file to add any additional validations or associations as appropriate
- The generator creates the migration, model file, test file, and fixture file — update the latter two with proper content
