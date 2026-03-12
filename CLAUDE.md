# FTW Trading — Project Rules

## Security: Secrets & Sensitive Data

- **NEVER hardcode secrets** (API keys, tokens, passwords, JWTs) in source files.
  Always use `process.env.VARIABLE_NAME` and reference `.env.local`.
- **NEVER commit `.env` files** — they are in `.gitignore` and must stay there.
- **`tmp/` is gitignored** — temporary/one-off scripts go there, never in tracked directories.
- When creating scripts that need DB access, always use environment variables:
  ```js
  // CORRECT
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  // WRONG — never do this
  const supabase = createClient('https://...', 'eyJ...')
  ```
- If you spot a hardcoded secret in existing code, flag it immediately.

## Language

- UI is in German (Deutsch). Code comments and variable names in English.
