# AI-Powered Support SaaS Backend

Production-ready backend for AI-assisted customer support with chat, ticketing, and role-based access.

## Build Order Overview

1. Server setup
2. DB connection
3. Auth system
4. Gemini AI service
5. Chat system
6. Decision engine
7. Ticket system
8. Role-based access
9. Testing guide

## Setup

1. Copy .env.example to .env and fill values.
2. Install dependencies: npm install
3. Start dev server: npm run dev

## API Summary

- Auth: /api/auth
- Chat: /api/chat
- Tickets: /api/tickets

## Notes

- Access tokens are returned in JSON responses.
- Refresh tokens are stored in httpOnly cookies.
- See POSTMAN.md for example requests.
- See SOCKETS.md for realtime testing.
