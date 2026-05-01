# Horizontal Scaling Proof (PM2 Cluster)

This backend is horizontally scaled locally using PM2 cluster mode with 4 worker processes for the same Node.js application.

## What Is Implemented

- PM2 cluster mode is enabled in `ecosystem.config.cjs`.
- Instance count is fixed to 4 workers.
- The backend entry runs through `server.js` and each worker boots the same app.
- Socket.IO events are cluster-safe through Redis adapter pub/sub.
- Shared state is maintained through MongoDB and Redis, so workers stay consistent.

## Proof Screenshots

### 1) Cluster Workers Online

`pm2 list`

![PM2 list showing 4 online workers](screenshots/01-pm2-list.png)

The process table shows `ai-support-backend` running with 4 online workers (IDs 0-3), proving multi-process horizontal scaling.

### 2) Live Logs While Traffic Is Served

`pm2 logs ai-support-backend --lines 50 --nostream`

![PM2 logs showing live backend activity](screenshots/02-pm2-monit.png)

Logs confirm active request/event handling while the cluster is running.

### 3) Multiple Node Processes at OS Level

`tasklist /FI "IMAGENAME eq node.exe"`

![Windows tasklist showing multiple node processes](screenshots/03-node-proccesses.png)

OS-level process list confirms multiple Node.js processes exist simultaneously, matching PM2 cluster behavior.

## Implementation Summary

Horizontal scaling is achieved by process-level parallelism: PM2 forks 4 workers of the same backend. Incoming traffic is distributed across workers, and Redis pub/sub keeps Socket.IO notifications synchronized across all workers. This enables real-time features to work correctly under a clustered backend architecture.