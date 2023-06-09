import {registerInstrumentations} from '@opentelemetry/instrumentation';
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node';
import {Resource} from '@opentelemetry/resources';
import {SimpleSpanProcessor} from '@opentelemetry/sdk-trace-base';
import {GrpcInstrumentation} from '@opentelemetry/instrumentation-grpc';
import {metrics} from '@opentelemetry/api';
import {ZipkinExporter} from '@opentelemetry/exporter-zipkin';
import {PrometheusExporter} from '@opentelemetry/exporter-prometheus';
import {MeterProvider} from '@opentelemetry/sdk-metrics';

/**
 * Initialize automatic grpc tracing, exporting to Zipkin.
 */
export function example_observability_setupTracing() {
  const resource = Resource.default();

  const provider = new NodeTracerProvider({
    resource: resource,
  });

  const exporter = new ZipkinExporter();

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  registerInstrumentations({
    instrumentations: [new GrpcInstrumentation()],
  });
}

/**
 * Initialize metrics, exporting to Prometheus.
 */
export function example_observability_setupMetrics() {
  const resource = Resource.default();

  const metricsExporter = new PrometheusExporter({}, () => {
    console.log('prometheus scrape endpoint: http://localhost:9464/metrics');
  });

  const meterProvider = new MeterProvider({
    resource: resource,
  });

  meterProvider.addMetricReader(metricsExporter);

  metrics.setGlobalMeterProvider(meterProvider);
}
