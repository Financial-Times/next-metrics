# Next Metrics

A library that used to send metrics to Graphite. Now it does nothing. See ["Unlucky 13"](#unlucky-13) below.

> [!WARNING]
> next-metrics has been deprecated as of **2024-07-29**. It will reach end-of-life on **2025-09-30** at which point no further security patches will be applied. The library will continue to work in currently-supported versions of Node.js but **it should not be used in new projects**.
>
> The recommended replacement for next-metrics is OpenTelemetry. We maintain [@dotcom-reliability-kit/opentelemetry](https://github.com/Financial-Times/dotcom-reliability-kit/tree/main/packages/opentelemetry#readme) to make this as easy as possible and we published [The Lazy Engineer's Guide to OpenTelemetry](https://financialtimes.atlassian.net/wiki/spaces/DS/blog/2024/06/24/8467087366/The+Lazy+Engineer's+Guide+to+OpenTelemetry) to help.


## Unlucky 13

As of `v13`, this library no longer does anything. It retains the same API as next-metrics `v12` but it no longer sends any metrics to Graphite and calling _any_ next-metrics method logs a warning asking you to remove the method call from your code.

This warning includes a stack trace to help you track down these uses. If you can't make the changes and you're fed up of these warnings you can disable them by setting a `NEXT_METRICS_SILENCE_WARNINGS` environment variable to `true`.

If you're still using the previous version of next-metrics, [you can find the original documentation here](https://github.com/Financial-Times/next-metrics/tree/12.x#readme).
