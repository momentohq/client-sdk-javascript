import {registerInstrumentations} from '@opentelemetry/instrumentation';
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node';
import {Resource} from '@opentelemetry/resources';
import {SemanticResourceAttributes} from '@opentelemetry/semantic-conventions';
import {SimpleSpanProcessor} from '@opentelemetry/sdk-trace-base';
import {GrpcInstrumentation} from '@opentelemetry/instrumentation-grpc';
import {metrics} from '@opentelemetry/api';
import {ZipkinExporter} from '@opentelemetry/exporter-zipkin';
import {PrometheusExporter} from '@opentelemetry/exporter-prometheus';
import {MeterProvider} from '@opentelemetry/sdk-metrics';

/**
 * Initializes automatic grpc tracing exported to Zipkin and metrics exported to Prometheus.
 * @param serviceName the name of the example.
 */
export default (serviceName: string) => {
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    })
  );

  // Set up tracing via zipkin
  const provider = new NodeTracerProvider({
    resource: resource,
  });

  const exporter = new ZipkinExporter();

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  registerInstrumentations({
    instrumentations: [new GrpcInstrumentation()],
  });

  // Set up metrics via prometheus
  const metricsExporter = new PrometheusExporter({}, () => {
    console.log('prometheus scrape endpoint: http://localhost:9464/metrics');
  });

  const myServiceMeterProvider = new MeterProvider({
    resource: resource,
  });

  myServiceMeterProvider.addMetricReader(metricsExporter);

  metrics.setGlobalMeterProvider(myServiceMeterProvider);
};
