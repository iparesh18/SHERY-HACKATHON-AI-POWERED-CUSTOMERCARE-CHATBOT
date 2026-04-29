# Realtime Socket Guide

This project uses Socket.io with JWT auth. Each client joins:
- user:<userId>
- role:<role>

Events emitted by the backend:
- chat:message
- ticket:created
- ticket:assigned
- ticket:status
- ticket:message

## Quick test (minimal)

1) Login with Postman to get an access token.
2) Run the socket client with the same token:

PowerShell:

$env:SOCKET_TOKEN = "<accessToken>"
node scripts/socket-client.js

You can also set a custom URL:

$env:SOCKET_URL = "http://localhost:5000"
$env:SOCKET_TOKEN = "<accessToken>"
node scripts/socket-client.js

## End-to-end flow test

1) Run socket client as CUSTOMER
- Login as customer in Postman and copy accessToken.
- Start socket client using that token.

2) Run socket client as AGENT
- Login as agent in Postman and copy accessToken.
- Start socket client in another terminal.

3) Run socket client as ADMIN (optional)
- Login as admin in Postman and copy accessToken.
- Start socket client in another terminal.

4) Trigger events
- Customer: POST /api/chat/send
  - Use a message that escalates to create a ticket.
  - You should see: ticket:created on agent and admin sockets.
  - Customer also receives ticket:created.

- Agent: PATCH /api/tickets/:id/take
  - Customer gets ticket:assigned.
  - Agent gets ticket:assigned.
  - Admin gets ticket:assigned.

- Agent: POST /api/tickets/:id/reply
  - Customer gets ticket:message.
  - Agent gets ticket:message.
  - Admin gets ticket:message.

- Agent or Admin: PATCH /api/tickets/:id/status
  - Customer gets ticket:status.
  - Assigned agent gets ticket:status.
  - Admin gets ticket:status.

## How the customer sees the resolution

When the agent replies or resolves the ticket:
- The customer receives realtime events over sockets.
- The customer can also call GET /api/chat/:userId to see the ticket reply mirrored into the chat thread.
