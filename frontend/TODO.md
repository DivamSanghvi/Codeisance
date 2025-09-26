# Frontend Integration TODO

## Tasks
- [x] Update Login.jsx: Simplify donor login to email + password only (remove PIN option). Change hospital login to licenseNo + password (remove email). Add fetch API calls to backend endpoints (/api/users/login/web for donor, /api/users/hospital/login for hospital). Handle success (store token in localStorage, redirect to dashboard) and errors (display messages).
- [x] Update Signup.jsx: Make email and password required for donor signup, remove PIN field. Add password field for hospital signup. Ensure services are sent as array (split by commas). Add fetch API calls to backend endpoints (/api/users/web-register for donor, /api/users/hospital/register for hospital). Handle success and errors.
- [ ] Test integration: Run backend on 8000, frontend on 5173. Submit forms, verify API calls, token storage, and error handling.

## Notes
- API base: http://localhost:8000
- Use fetch with JSON, credentials: 'include' for CORS.
- No new dependencies.
- Adjust fields to match backend schemas exactly.
