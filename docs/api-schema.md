# Chronos-Index API Schema

Base URL: `http://localhost:3001/api/v1`

---

## Endpoints Overview

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/health` | Servis durumu |
| GET | `/gainers` | En çok yükselen coinler |
| GET | `/symbols` | Tüm desteklenen semboller |
| GET | `/symbols/:symbol` | Sembol detayı |
| GET | `/symbols/:symbol/ohlcv` | OHLCV verileri |
| GET | `/timeframes` | Desteklenen zaman dilimleri |

---

## Health Check

### `GET /health`

Servis ve bağımlılıkların durumunu kontrol eder.

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-17T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "binance": "connected"
  },
  "uptime": 3600
}
```

---

## Gainers

### `GET /gainers`

Belirtilen zaman diliminde en çok yükselen coinleri döner.

**Query Parameters:**
| Param | Type | Required | Default | Açıklama |
|-------|------|----------|---------|----------|
| `timeframe` | string | No | `1h` | Zaman dilimi (5m, 15m, 1h, 4h, 1d, 3d, 7d) |
| `limit` | number | No | `20` | Sonuç sayısı (max: 100) |
| `minVolume` | number | No | `0` | Minimum 24h volume (USDT) |

**Response 200:**
```json
{
  "timeframe": "4h",
  "updatedAt": "2025-12-17T00:00:00.000Z",
  "data": [
    {
      "rank": 1,
      "symbol": "BTCUSDT",
      "price": 105000.50,
      "priceChange": 2500.00,
      "priceChangePercent": 2.44,
      "volume24h": 15000000000,
      "high": 106000.00,
      "low": 102000.00
    }
  ],
  "meta": {
    "total": 20,
    "hasMore": true,
    "nextCursor": "eyJvZmZzZXQiOjIwfQ=="
  }
}
```

---

## Symbols

### `GET /symbols`

Tüm desteklenen Binance Futures sembollerini listeler.

**Query Parameters:**
| Param | Type | Required | Default | Açıklama |
|-------|------|----------|---------|----------|
| `status` | string | No | `TRADING` | Sembol durumu |
| `search` | string | No | - | Sembol arama (ör: "BTC") |

**Response 200:**
```json
{
  "data": [
    {
      "symbol": "BTCUSDT",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "status": "TRADING",
      "pricePrecision": 2,
      "quantityPrecision": 3
    }
  ],
  "meta": {
    "total": 250
  }
}
```

---

### `GET /symbols/:symbol`

Tek bir sembolün detaylı bilgisini döner.

**Path Parameters:**
| Param | Type | Açıklama |
|-------|------|----------|
| `symbol` | string | Sembol adı (ör: BTCUSDT) |

**Response 200:**
```json
{
  "symbol": "BTCUSDT",
  "baseAsset": "BTC",
  "quoteAsset": "USDT",
  "status": "TRADING",
  "price": 105000.50,
  "priceChange24h": 2.44,
  "volume24h": 15000000000,
  "high24h": 106000.00,
  "low24h": 102000.00,
  "openInterest": 5000000000,
  "fundingRate": 0.0001
}
```

**Response 404:**
```json
{
  "type": "https://api.chronos-index.dev/errors/not-found",
  "title": "Symbol Not Found",
  "status": 404,
  "detail": "Symbol 'INVALIDUSDT' is not supported",
  "instance": "/api/v1/symbols/INVALIDUSDT"
}
```

---

### `GET /symbols/:symbol/ohlcv`

Belirtilen sembol için OHLCV (Open, High, Low, Close, Volume) verilerini döner.

**Path Parameters:**
| Param | Type | Açıklama |
|-------|------|----------|
| `symbol` | string | Sembol adı |

**Query Parameters:**
| Param | Type | Required | Default | Açıklama |
|-------|------|----------|---------|----------|
| `interval` | string | No | `1h` | Kline aralığı (1m, 5m, 15m, 1h, 4h, 1d) |
| `startTime` | number | No | - | Başlangıç timestamp (ms) |
| `endTime` | number | No | - | Bitiş timestamp (ms) |
| `limit` | number | No | `100` | Sonuç sayısı (max: 1000) |

**Response 200:**
```json
{
  "symbol": "BTCUSDT",
  "interval": "1h",
  "data": [
    {
      "time": "2025-12-17T00:00:00.000Z",
      "open": 104500.00,
      "high": 105500.00,
      "low": 104000.00,
      "close": 105000.00,
      "volume": 1500.50,
      "quoteVolume": 157500000.00,
      "trades": 25000
    }
  ],
  "meta": {
    "count": 100
  }
}
```

---

## Timeframes

### `GET /timeframes`

Desteklenen zaman dilimlerini ve açıklamalarını döner.

**Response 200:**
```json
{
  "data": [
    {
      "id": "5m",
      "label": "5 Dakika",
      "seconds": 300,
      "category": "short"
    },
    {
      "id": "15m",
      "label": "15 Dakika",
      "seconds": 900,
      "category": "short"
    },
    {
      "id": "1h",
      "label": "1 Saat",
      "seconds": 3600,
      "category": "medium"
    },
    {
      "id": "4h",
      "label": "4 Saat",
      "seconds": 14400,
      "category": "medium"
    },
    {
      "id": "1d",
      "label": "1 Gün",
      "seconds": 86400,
      "category": "long"
    },
    {
      "id": "3d",
      "label": "3 Gün",
      "seconds": 259200,
      "category": "long"
    },
    {
      "id": "7d",
      "label": "1 Hafta",
      "seconds": 604800,
      "category": "long"
    }
  ]
}
```

---

## Error Responses

Tüm hatalar RFC 7807 Problem Details formatında döner:

```json
{
  "type": "https://api.chronos-index.dev/errors/{error-type}",
  "title": "Error Title",
  "status": 400,
  "detail": "Detailed error message",
  "instance": "/api/v1/endpoint"
}
```

### Common Error Codes

| Status | Type | Açıklama |
|--------|------|----------|
| 400 | `bad-request` | Geçersiz istek parametreleri |
| 404 | `not-found` | Kaynak bulunamadı |
| 429 | `rate-limit-exceeded` | Rate limit aşıldı |
| 500 | `internal-error` | Sunucu hatası |
| 503 | `service-unavailable` | Servis geçici olarak kullanılamıyor |

---

## Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Default | 100 requests | Per minute |
| Authenticated | 1000 requests | Per minute |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702771200
```

---

## WebSocket API (Future)

> Bu bölüm ilerleyen aşamalarda implemente edilecektir.

**Endpoint:** `ws://localhost:3001/ws`

**Subscribe Message:**
```json
{
  "action": "subscribe",
  "channel": "gainers",
  "params": {
    "timeframe": "1h"
  }
}
```

**Update Message:**
```json
{
  "channel": "gainers",
  "timeframe": "1h",
  "data": [...]
}
```
