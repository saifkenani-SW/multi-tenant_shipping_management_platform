import 'dotenv/config';

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const serviceName =
  process.env.OTEL_SERVICE_NAME ?? 'enterprise-nestjs-service';

// لا تُمرَّر `url` صراحة: هذا يسمح للمُصدِّر بقراءة
// OTEL_EXPORTER_OTLP_ENDPOINT + المسار المناسب (/v1/traces, /v1/metrics) تلقائيًا.
const traceExporter = new OTLPTraceExporter();
const metricExporter = new OTLPMetricExporter();

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL ?? 30000),
});

const sdk = new NodeSDK({
  serviceName,
  traceExporter,
  metricReaders: [metricReader],
  instrumentations: [
    getNodeAutoInstrumentations({
      // تعطيل fs لتجنب الضجيج الزائد من عمليات قراءة الملفات الداخلية
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
    // Prisma لا تُلتقط تلقائياً عبر auto-instrumentations (تمر عبر binary engine)
    // الإصدار 7.9.1 >= 5.0 -- لا previewFeatures مطلوبة في schema.prisma
    new PrismaInstrumentation(),
  ],
});

try {
  sdk.start();
  console.log('[observability] OpenTelemetry SDK started.');
} catch (error) {
  console.error('[observability] Failed to start OpenTelemetry SDK.', error);
}

const shutdown = async (signal: string): Promise<void> => {
  console.log(
    `[observability] Received ${signal}. Shutting down OpenTelemetry...`,
  );
  try {
    await sdk.shutdown();
    console.log('[observability] OpenTelemetry shutdown completed.');
  } catch (error) {
    console.error('[observability] OpenTelemetry shutdown failed.', error);
  } finally {
    process.exit(0);
  }
};

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
