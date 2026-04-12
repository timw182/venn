---
name: gen-test
description: Generate tests for a given file using pytest (backend) or vitest (frontend)
disable-model-invocation: true
---

# Generate Tests Skill

Generate tests for the file path provided as an argument.

## Determine test framework

- If the file is under `backend/`: use **pytest** with `pytest-asyncio` for async endpoints
- If the file is under `frontend/src/`: use **vitest** with React Testing Library
- If the file is under `mobile/src/`: use **jest** with React Native Testing Library

## Steps

1. Read the target file to understand its exports, functions, and behavior
2. Read related files (imports, types, context) to understand dependencies
3. Generate a test file following these conventions:
   - **Backend**: place in `backend/tests/test_<module>.py` — use `httpx.AsyncClient` with FastAPI's `TestClient` pattern
   - **Frontend**: place next to the source file as `<name>.test.jsx` — use `@testing-library/react`
   - **Mobile**: place next to the source file as `<name>.test.jsx`
4. Cover the main happy path and key edge cases (aim for 3-6 test cases)
5. Do NOT mock the database for backend tests — use a real test SQLite DB

## Output
Show the generated test file and suggest the command to run it.
