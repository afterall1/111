-- CreateTable
CREATE TABLE "Symbol" (
    "symbol" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "Candle" (
    "time" TIMESTAMP(3) NOT NULL,
    "symbol" TEXT NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Candle_pkey" PRIMARY KEY ("time","symbol")
);

-- CreateIndex
CREATE INDEX "Candle_symbol_idx" ON "Candle"("symbol");

-- AddForeignKey
ALTER TABLE "Candle" ADD CONSTRAINT "Candle_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "Symbol"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TimescaleDB Eklentisini Aktifleştir (Sadece ilk kurulumda)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Candle tablosunu Hypertable'a dönüştür
-- (NOT: Tablo boşken yapılmalıdır)
SELECT create_hypertable('"Candle"', 'time');

-- Sıkıştırma Politikası (Opsiyonel ama performans için iyi)
ALTER TABLE "Candle" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol',
  timescaledb.compress_orderby = 'time DESC'
);

-- 7 Günden eski sıkıştırılmış veriyi otomatik yönet (Policy)
SELECT add_compression_policy('"Candle"', INTERVAL '7 days');
