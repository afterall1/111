# Chronos-Index Architecture

## Overview

Chronos-Index, Binance Futures verilerini analiz eden ve kullanıcılara özel zaman periyotlarında (15dk, 4h, 3d vb.) en çok yükselen coinleri gösteren yüksek performanslı bir uygulamadır.

---

## Tech Stack

### Backend
| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| Node.js | 20+ LTS | Runtime |
| TypeScript | 5.3+ | Type safety |
| Express | 4.x | HTTP framework |
| TimescaleDB | 2.x | Time-series veritabanı |
| Redis | 7.x | Caching & Pub/Sub |
| BullMQ | 5.x | Job queue |

### Frontend
| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| Next.js | 15+ | React framework (App Router) |
| TailwindCSS | 3.4+ | Styling |
| TanStack Query | 5.x | Server state management |
| Framer Motion | 11+ | Animasyonlar |

---

## Database Schema (TimescaleDB + Prisma)

> **Durum:** ✅ Uygulandı ve Doğrulandı (2025-12-17)

### Prisma Modelleri

#### Model: `Symbol`
Binance Futures sembol metadata'sı.

```prisma
model Symbol {
  symbol     String   @id // Örn: BTCUSDT
  baseAsset  String       // Örn: BTC
  quoteAsset String       // Örn: USDT
  isActive   Boolean  @default(true)
  candles    Candle[]
}
```

#### Model: `Candle` (TimescaleDB Hypertable)
OHLCV mum verileri - **Hypertable olarak yapılandırıldı**.

```prisma
model Candle {
  time   DateTime  // Partition key
  symbol String    // Foreign key to Symbol
  open   Float
  high   Float
  low    Float
  close  Float
  volume Float
  
  symbolRel Symbol @relation(fields: [symbol], references: [symbol])

  @@id([time, symbol]) // Composite Primary Key
}
```

### TimescaleDB Hypertable Yapılandırması

| Özellik | Değer |
|---------|-------|
| Hypertable Adı | `Candle` |
| Partition Key | `time` |
| Compression | ✅ Aktif |
| Compress Segmentby | `symbol` |
| Compress Orderby | `time DESC` |
| Compression Policy | 7 gün (otomatik) |

```sql
-- Hypertable dönüşümü
SELECT create_hypertable('"Candle"', 'time');

-- Compression ayarları
ALTER TABLE "Candle" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol',
  timescaledb.compress_orderby = 'time DESC'
);

-- Auto-compression policy
SELECT add_compression_policy('"Candle"', INTERVAL '7 days');
```

### Veritabanı Bağlantısı

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/chronos?schema=public
```

### Continuous Aggregates (Planlanan)

```sql
-- 15 dakikalık aggregate (gelecekte eklenecek)
CREATE MATERIALIZED VIEW candles_15m
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('15 minutes', time) AS bucket,
    symbol,
    first(open, time) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, time) AS close,
    sum(volume) AS volume
FROM "Candle"
GROUP BY bucket, symbol;
```

---

## Redis Strategy

### Cache Keys

| Pattern | TTL | Açıklama |
|---------|-----|----------|
| `gainers:{timeframe}` | 30s | En çok yükselenler listesi |
| `symbol:{symbol}:price` | 5s | Anlık fiyat bilgisi |
| `symbol:{symbol}:ohlcv:{tf}` | 60s | Belirli timeframe OHLCV |
| `ws:subscriptions` | - | WebSocket abonelikleri (Set) |

### Cache Invalidation Strategy

1. **Time-based:** TTL ile otomatik expire
2. **Event-based:** BullMQ job tamamlandığında ilgili cache'i invalidate et
3. **Hybrid:** Kritik veriler için hem TTL hem event-based

### Pub/Sub Channels

| Channel | Payload | Amaç |
|---------|---------|------|
| `price:updates` | `{symbol, price, change}` | Anlık fiyat güncellemeleri |
| `gainers:updated` | `{timeframe, data[]}` | Gainer listesi değişimi |

---

## BullMQ Job Queue

### Queues

| Queue | Concurrency | Amaç |
|-------|-------------|------|
| `data-fetch` | 5 | Binance API'den veri çekme |
| `aggregation` | 2 | Continuous aggregate tetikleme |
| `analytics` | 3 | Gainer hesaplama |

### Job Types

```typescript
interface DataFetchJob {
  type: 'fetch-ohlcv';
  symbol: string;
  interval: string;
  startTime: number;
  endTime: number;
}

interface AggregationJob {
  type: 'refresh-continuous-agg';
  timeframe: '15m' | '4h' | '1d' | '3d';
}

interface AnalyticsJob {
  type: 'calculate-gainers';
  timeframe: string;
  topN: number;
}
```

### Cron Jobs (Repeatable)

| Job | Schedule | Açıklama |
|-----|----------|----------|
| Fetch 1m OHLCV | `*/1 * * * *` | Her dakika tüm sembollerin 1m verisini çek |
| Refresh 15m Agg | `*/15 * * * *` | 15 dakikalık continuous agg'ı refresh et |
| Calculate Gainers | `*/5 * * * *` | Tüm timeframe'ler için gainer hesapla |

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│                    (Next.js App Router)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │   Controllers │  │   Services    │  │  Repositories │    │
│  │               │──▶│               │──▶│               │    │
│  │ - GainerCtrl  │  │ - GainerSvc   │  │ - OhlcvRepo   │    │
│  │ - SymbolCtrl  │  │ - SymbolSvc   │  │ - SymbolRepo  │    │
│  │ - HealthCtrl  │  │ - CacheSvc    │  │ - CacheRepo   │    │
│  └───────────────┘  └───────────────┘  └───────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     BullMQ Workers                     │  │
│  │  - DataFetchWorker  - AggregationWorker  - AnalyticsW │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │TimescaleDB│   │  Redis   │    │ Binance  │
    │           │   │          │    │   API    │
    └──────────┘    └──────────┘    └──────────┘
```

---

## API Design Principles

1. **RESTful:** Resource-based URL yapısı
2. **Versioning:** `/api/v1/...` prefix
3. **Pagination:** Cursor-based pagination
4. **Rate Limiting:** IP bazlı, Redis ile
5. **Error Format:** RFC 7807 Problem Details

---

## Security Considerations

1. **Input Validation:** Zod ile tüm input'ları validate et
2. **Rate Limiting:** Brute-force koruması
3. **CORS:** Sadece izin verilen origin'ler
4. **Helmet:** HTTP security headers
5. **No Secrets in Code:** Environment variables kullan

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (P95) | < 100ms |
| WebSocket Latency | < 50ms |
| Data Freshness | < 5 seconds |
| Concurrent Users | 1000+ |
