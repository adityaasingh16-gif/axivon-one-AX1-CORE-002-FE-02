import type { ReportFilter } from '../contracts';

interface Props { filters: ReportFilter[]; values: Record<string,string>; onChange: (key:string,value:string)=>void; onApply?:()=>void; onReset?:()=>void; }

export function ReportFilters({ filters, values, onChange, onApply, onReset }: Props) {
  return <section aria-labelledby="report-filters-title">
    <div><h2 id="report-filters-title">Filters</h2><p>Refine the reporting results using the available criteria.</p></div>
    <div>
      {filters.map(filter => <label key={filter.key}>{filter.label}
        {filter.options ? <select value={values[filter.key] ?? ''} onChange={e=>onChange(filter.key,e.target.value)}>
          <option value="">All</option>{filter.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : <input value={values[filter.key] ?? ''} onChange={e=>onChange(filter.key,e.target.value)} placeholder={`Filter by ${filter.label.toLowerCase()}`} />}
      </label>)}
    </div>
    <div>{onApply && <button type="button" onClick={onApply}>Apply filters</button>}{onReset && <button type="button" onClick={onReset}>Reset</button>}</div>
  </section>;
}
