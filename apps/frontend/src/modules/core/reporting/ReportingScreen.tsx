import { useMemo, useState } from 'react';
import type { ReportViewModel } from './contracts';
import { ReportHeader } from './components/ReportHeader';
import { ReportFilters } from './components/ReportFilters';
import { ReportSummary } from './components/ReportSummary';
import { ReportResults } from './components/ReportResults';

const demoReport: ReportViewModel = {
  metadata: { id:'report-preview', title:'Reporting Overview', description:'Review report metadata, summary metrics and result records.', status:'ready' },
  filters: [
    { key:'period', label:'Period', options:[{value:'7d',label:'Last 7 days'},{value:'30d',label:'Last 30 days'},{value:'90d',label:'Last 90 days'}] },
    { key:'status', label:'Status', options:[{value:'active',label:'Active'},{value:'completed',label:'Completed'},{value:'pending',label:'Pending'}] }
  ],
  summary: [
    { key:'records', label:'Records', value:0, helper:'Available in current result set' },
    { key:'status', label:'Status', value:'Ready', helper:'Report is ready to review' },
    { key:'updated', label:'Last updated', value:'—', helper:'Uses approved report metadata when connected' }
  ],
  columns: [{key:'name',label:'Name'},{key:'status',label:'Status'},{key:'updated',label:'Updated'}],
  rows: []
};

export function ReportingScreen({ report = demoReport }: { report?: ReportViewModel }) {
  const [filters,setFilters]=useState<Record<string,string>>({});
  const [applied,setApplied]=useState(filters);
  const hasActiveFilters=useMemo(()=>Object.values(applied).some(Boolean),[applied]);
  const summary=report.summary.map(metric=>metric.key==='records'?{...metric,value:report.rows.length}:metric);
  const apply=()=>setApplied(filters);
  const reset=()=>{setFilters({});setApplied({});};
  return <main aria-labelledby="report-title">
    <ReportHeader metadata={report.metadata} />
    <ReportFilters filters={report.filters} values={filters} onChange={(key,value)=>setFilters(current=>({...current,[key]:value}))} onApply={apply} onReset={reset} />
    <ReportSummary metrics={summary} />
    {hasActiveFilters && <p role="status">Filters applied: {Object.entries(applied).filter(([,value])=>value).map(([key,value])=>`${key}: ${value}`).join(' · ')}</p>}
    <ReportResults columns={report.columns} rows={report.rows} />
  </main>;
}
