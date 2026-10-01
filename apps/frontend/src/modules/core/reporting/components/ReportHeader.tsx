import type { ReportMetadata } from '../contracts';

interface Props { metadata: ReportMetadata; onRefresh?: () => void; }

export function ReportHeader({ metadata, onRefresh }: Props) {
  return <header aria-labelledby="report-title">
    <div>
      <p>Reporting</p>
      <h1 id="report-title">{metadata.title}</h1>
      {metadata.description && <p>{metadata.description}</p>}
      <small>
        {metadata.status ? `Status: ${metadata.status}` : 'Report'}
        {metadata.generatedAt ? ` · Generated ${metadata.generatedAt}` : ''}
        {metadata.generatedBy ? ` · By ${metadata.generatedBy}` : ''}
      </small>
    </div>
    {onRefresh && <button type="button" onClick={onRefresh}>Refresh</button>}
  </header>;
}
