# Postman Testing Guide

## Auth

- POST /api/auth/register
  - Body: { "name": "Jane", "email": "jane@acme.com", "password": "secret123", "role": "customer" }
- POST /api/auth/login
  - Body: { "email": "jane@acme.com", "password": "secret123" }
- POST /api/auth/refresh
  - Uses refresh token cookie
- POST /api/auth/logout
  - Requires access token

## Chat

- POST /api/chat/send
  - Auth: Bearer access token
  - Body: { "message": "Hello" }
- GET /api/chat/:userId
  - Auth: Bearer access token

## Tickets (Agent/Admin)

- GET /api/tickets
  - Auth: Bearer access token
  - Optional query: ?status=open
- GET /api/tickets/:id
  - Auth: Bearer access token
- PATCH /api/tickets/:id/take
  - Agent only
- PATCH /api/tickets/:id/assign
  - Admin only
  - Body: { "agentId": "<agent-id>" }
- PATCH /api/tickets/:id/status
  - Agent/Admin
  - Body: { "status": "resolved" }
- POST /api/tickets/:id/reply
  - Agent/Admin
  - Body: { "message": "We are on it." }
