# Menu API – Frontend Contract (Backend v1.0)

## General Rules
- Backend is the single source of truth
- Frontend must follow Swagger exactly
- Full payload submission only (no diffs)
- Frontend must not generate IDs
- Frontend must not auto-commit

## Error Handling
- 400 → Validation error (do not retry)
- 409 → Business conflict (user action required)
- 500 → System failure (retry allowed)

## Commit Rules
- Payload must be approved by user
- Commit is idempotent per snapshot
- Duplicate submissions must not create duplicates
