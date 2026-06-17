# EventStream — Real-Time Event Processing Platform

A production-style MERN stack application demonstrating distributed event processing, Kafka pub/sub, Redis caching, and WebSocket live dashboards.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Recharts, Socket.io-client |
| Backend | Node.js, Express |
| Message Broker | Apache Kafka (KafkaJS) |
| Cache / Buffer | Redis (ioredis) |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io (WebSockets) |
| Container | Docker + Docker Compose |

## Architecture

```
React Dashboard
     │  WebSocket (Socket.io)
     │  REST /api/events
     ▼
Express Server ──→ Kafka Producer ──→ [platform.events topic]
     │                                         │
     │                              Kafka Consumer
     │                                         │
     ▼                                         ▼
MongoDB (persist)            Redis (rate track + buffer)
                                         │
                               WebSocket broadcast → Dashboard
```

**Event Flow:**
1. Client POSTs event → Express validates → Kafka producer publishes
2. Kafka consumer receives → MongoDB persist + Redis rate counter + Redis buffer
3. Alert engine checks thresholds → triggers WebSocket notification
4. Socket.io broadcasts `event:new` and `stats:update` to all dashboard clients

## Quick Start

### Prerequisites
- Docker & Docker Compose

### Run

```bash
git clone <repo>
cd event-platform
docker-compose up --build
```

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:5000/api
- **Health**: http://localhost:5000/health

### Local Dev (without Docker)

Start Kafka, Redis, MongoDB locally, then:

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## API Reference

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events` | Ingest single event |
| POST | `/api/events/batch` | Ingest batch (max 100) |
| GET | `/api/events` | List events (paginated) |
| GET | `/api/events/stats` | Live stats |
| GET | `/api/events/analytics` | Aggregated analytics |
| GET | `/api/events/stream/:type` | Redis-buffered recent events |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/alerts` | List alert rules |
| POST | `/api/events/alerts` | Create alert rule |
| PATCH | `/api/events/alerts/:id/toggle` | Enable/disable alert |

### Event Schema

```json
{
  "type": "USER_ACTION | SYSTEM | ERROR | PAYMENT | SENSOR | CUSTOM",
  "source": "service-name",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "payload": {}
}
```

### WebSocket Events

| Event | Direction | Data |
|-------|-----------|------|
| `event:new` | Server → Client | New event object |
| `stats:update` | Server → Client | Live stats snapshot |
| `alert:triggered` | Server → Client | Alert trigger details |

## System Design Highlights

### Publish-Subscribe (Kafka)
Events are published to `platform.events` topic asynchronously. The backend immediately returns `202 Accepted` — the producer and consumer are fully decoupled, enabling horizontal scaling of consumers.

### Stream Processing
The Kafka consumer processes each event: persistence → rate tracking → alert evaluation → WebSocket broadcast. This pipeline is the core stream processor.

### Event Sourcing
Every event is immutable once written to MongoDB. Events have a TTL (7 days) and are the source of truth for analytics aggregations.

### Redis Caching Strategy
- **Rate counters**: sliding-window counters per event type, refreshed every 60s
- **Ring buffer**: last 100 events per type stored in Redis lists for instant dashboard reads
- **Stats cache**: aggregated stats cached for 5s to prevent MongoDB hammering under load

### Real-Time Delivery
Socket.io broadcasts over WebSocket with polling fallback. Stats are pushed on every processed event, keeping the dashboard live without polling.

## Resume Points

> **Real-Time Event Processing Platform | Node.js, Kafka, Redis, WebSockets, MongoDB**
>
> - Built a distributed event-processing platform capable of ingesting and processing high-volume events in real time using a MERN stack with KafkaJS.
> - Implemented Kafka-based publish-subscribe architecture supporting asynchronous, decoupled communication across services with `202 Accepted` ingest pattern.
> - Developed Socket.io-powered live dashboards delivering real-time event feeds, throughput metrics, and alert notifications to connected clients.
> - Integrated Redis-backed sliding-window rate counters and ring-buffer caching to reduce MongoDB read pressure and improve dashboard responsiveness.
> - Designed an alert engine evaluating configurable threshold conditions per event type and window, broadcasting trigger notifications via WebSocket.

## Project Structure

```
event-platform/
├── backend/
│   └── src/
│       ├── config/       # Centralized config
│       ├── models/       # Mongoose schemas (Event, Alert)
│       ├── routes/       # Express routes
│       └── services/
│           ├── kafka.js          # Producer + consumer
│           ├── redis.js          # Caching + counters
│           └── eventProcessor.js # Core processing logic
├── frontend/
│   └── src/
│       ├── hooks/        # useSocket, useStats, useLiveEvents, useAlerts
│       ├── components/   # StatsCards, EventFeed, RateChart, AlertPanel, SimulatorPanel
│       └── utils/        # Event simulator
└── docker-compose.yml
```
