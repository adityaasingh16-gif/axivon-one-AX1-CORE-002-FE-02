import type { ReportSummaryMetric } from '../contracts';

export function ReportSummary({ metrics }: { metrics: ReportSummaryMetric[] }) {
  return <section aria-labelledby="report-summary-title"><h2 id="report-summary-title">Summary</h2><div>{metrics.map(metric=><article key={metric.key}><p>{metric.label}</p><strong>{metric.value}</strong>{metric.helper&&<small>{metric.helper}</small>}</article>)}</div></section>;
}
