-- TimescaleDB Hypertable Dönüşümü
-- Prisma migration SONRASI çalıştırılacak SQL
-- Kullanım: docker exec -i chronos_db psql -U postgres -d chronos < prisma/timescale_setup.sql

-- 1. TimescaleDB extension'ı aktif et (imajda zaten var ama emin olmak için)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Candle tablosunu Hypertable'a dönüştür
SELECT create_hypertable('"Candle"', 'time', if_not_exists => TRUE);

-- 3. Compression ayarları (Opsiyonel ama performans için önerilir)
ALTER TABLE "Candle" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol',
  timescaledb.compress_orderby = 'time DESC'
);

-- 4. Otomatik compression policy (7 günden eski verileri sıkıştır)
SELECT add_compression_policy('"Candle"', INTERVAL '7 days', if_not_exists => TRUE);

-- Doğrulama sorgusu:
-- SELECT * FROM timescaledb_information.hypertables WHERE hypertable_name = 'Candle';
