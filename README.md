# Game Telemetry API

A real-time analytics and telemetry service for game developers. Collects events from games (crashes, performance metrics, player sessions), stores them efficiently, and displays insights via a Vue dashboard. Includes Discord alerting for critical issues.

Built as a portfolio project demonstrating full-stack JavaScript development with a focus on backend APIs, database design, and third-party integrations.

## Features

- **Event Ingestion API** — RESTful endpoints to receive telemetry from games
- **Dual Database Architecture** — MySQL for structured data (players, sessions), MongoDB for flexible event logs
- **Real-time Dashboard** — Vue.js frontend with charts showing crashes, performance, player counts
- **Discord Alerts** — Webhook integration to notify teams when crash rates spike
- **API Documentation** — OpenAPI/Swagger docs

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, TypeScript |
| Databases | MySQL (relational data), MongoDB (event logs) |
| Frontend | Vue.js 3, Chart.js |
| Infrastructure | Docker, AWS Lambda (optional serverless endpoint) |
| Integrations | Discord Webhooks API |
| Testing | Jest, Supertest |
| Docs | Swagger/OpenAPI |

## API Endpoints

### Events

```
POST /api/events
```
Submit telemetry events from a game client.

```json
{
  "gameId": "sniper-elite-6",
  "eventType": "crash",
  "severity": "critical",
  "payload": {
    "platform": "PC",
    "version": "1.2.3",
    "stackTrace": "...",
    "memoryUsage": 4096
  },
  "timestamp": "2024-12-24T10:30:00Z"
}
```

```
GET /api/events?gameId=sniper-elite-6&type=crash&from=2024-12-01
```
Query events with filtering.

### Metrics

```
GET /api/metrics/summary?gameId=sniper-elite-6
```
Returns aggregated stats: crash count, avg session length, active players.

```
GET /api/metrics/timeseries?gameId=sniper-elite-6&metric=crashes&interval=hour
```
Returns time-bucketed data for charting.

### Health

```
GET /api/health
```
Service health check (useful for deployment monitoring).

## Database Schema

### MySQL (Structured Data)

```sql
-- Games registered in the system
CREATE TABLE games (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player sessions
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id VARCHAR(50),
  player_id VARCHAR(100),
  platform VARCHAR(50),
  version VARCHAR(20),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Aggregated daily stats (for fast dashboard queries)
CREATE TABLE daily_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id VARCHAR(50),
  date DATE,
  crash_count INT DEFAULT 0,
  session_count INT DEFAULT 0,
  avg_session_seconds INT,
  UNIQUE KEY (game_id, date),
  FOREIGN KEY (game_id) REFERENCES games(id)
);
```

### MongoDB (Flexible Event Logs)

```javascript
// events collection
{
  _id: ObjectId,
  gameId: "sniper-elite-6",
  eventType: "crash",           // crash, performance, custom
  severity: "critical",         // info, warning, critical
  payload: { ... },             // flexible schema per event type
  timestamp: ISODate,
  processedAt: ISODate
}

// Indexes for common queries
db.events.createIndex({ gameId: 1, timestamp: -1 })
db.events.createIndex({ gameId: 1, eventType: 1, timestamp: -1 })
```

## Project Structure

```
game-telemetry-api/
├── src/
│   ├── config/
│   │   ├── database.ts         # MySQL + MongoDB connections
│   │   └── discord.ts          # Discord webhook config
│   ├── controllers/
│   │   ├── events.controller.ts
│   │   └── metrics.controller.ts
│   ├── services/
│   │   ├── events.service.ts   # Business logic for events
│   │   ├── metrics.service.ts  # Aggregation queries
│   │   └── alerts.service.ts   # Discord notifications
│   ├── models/
│   │   ├── mysql/
│   │   │   ├── Game.ts
│   │   │   ├── Session.ts
│   │   │   └── DailyStats.ts
│   │   └── mongo/
│   │       └── Event.ts
│   ├── middleware/
│   │   ├── validation.ts       # Request validation
│   │   └── rateLimit.ts        # API rate limiting
│   ├── routes/
│   │   └── index.ts
│   ├── utils/
│   │   └── logger.ts
│   └── app.ts
├── dashboard/                   # Vue.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CrashChart.vue
│   │   │   ├── PlayerCount.vue
│   │   │   └── EventLog.vue
│   │   ├── views/
│   │   │   └── Dashboard.vue
│   │   └── App.vue
│   └── package.json
├── lambda/                      # Optional serverless endpoint
│   └── ingest-event.ts
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## Running Locally

### Prerequisites

- Node.js 18+
- Docker (for MySQL and MongoDB)
- Discord webhook URL (optional, for alerts)

### Setup

```bash
# Clone the repo
git clone https://github.com/iggytomcarr/game-telemetry-api.git
cd game-telemetry-api

# Start databases
docker-compose up -d

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Discord webhook URL

# Run database migrations
npm run db:migrate

# Start the API
npm run dev

# In another terminal, start the dashboard
cd dashboard
npm install
npm run dev
```

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=telemetry
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=game_telemetry

# MongoDB
MONGO_URI=mongodb://localhost:27017/game_telemetry

# Discord (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_ALERT_THRESHOLD=10  # crashes per hour to trigger alert
```

## Discord Alerts

When crash rates exceed the configured threshold, the service sends an alert:

```
🚨 Crash Alert: sniper-elite-6

Crash rate has exceeded threshold!
• Crashes in last hour: 47
• Threshold: 10
• Most common: NullPointerException in RenderThread

View dashboard: https://your-dashboard.com/games/sniper-elite-6
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests (requires Docker)
npm run test:integration
```

## Deployment

### Docker

```bash
docker build -t game-telemetry-api .
docker run -p 3000:3000 --env-file .env game-telemetry-api
```

### AWS Lambda (Serverless Ingestion)

The `/lambda` directory contains a standalone function for high-volume event ingestion:

```bash
cd lambda
npm install
npm run deploy  # Uses Serverless Framework
```

## What I Learned

- Designing APIs that handle high-volume writes (batching, async processing)
- When to use SQL vs NoSQL — structured relational data in MySQL, flexible event payloads in MongoDB
- Third-party API integration patterns (Discord webhooks with retry logic)
- TypeScript for better code reliability and documentation
- Writing queryable time-series aggregations

## Future Improvements

- [ ] Add authentication (API keys per game)
- [ ] Real-time dashboard updates via WebSockets
- [ ] Export functionality (CSV/JSON downloads)
- [ ] Retention policies (auto-delete old events)
- [ ] More alert channels (Slack, email)

## License

MIT

---

Built by [Tom Carr](https://github.com/iggytomcarr) as a portfolio project demonstrating full-stack JavaScript development for game tooling.
