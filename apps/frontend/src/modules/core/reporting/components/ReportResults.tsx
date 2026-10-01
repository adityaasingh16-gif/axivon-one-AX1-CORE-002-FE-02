import type { ReportResultColumn, ReportResultRow } from '../contracts';

interface Props { columns: ReportResultColumn[]; rows: ReportResultRow[]; loading?: boolean; error?: string|null; emptyMessage?: string; onRetry?:()=>void; }

export function ReportResults({ columns, rows, loading, error, emptyMessage='No report results match the selected filters.', onRetry }: Props) {
  if (loading) return <section aria-live="polite"><h2>Results</h2><p role="status">Loading report results…</p></section>;
  if (error) return <section role="alert"><h2>Results</h2><p>{error}</p>{onRetry&&<button type="button" onClick={onRetry}>Retry</button>}</section>;
  return <section aria-labelledby="report-results-title"><h2 id="report-results-title">Results</h2>{rows.length===0 ? <p role="status">{emptyMessage}</p> : <div><table><thead><tr>{columns.map(c=><th key={c.key} scope="col">{c.label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}>{columns.map(c=><td key={c.key}>{row.values[c.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>}</section>;
}
