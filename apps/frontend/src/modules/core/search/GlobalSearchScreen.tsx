import type { FormEvent } from 'react';
import { useGlobalSearch } from './useGlobalSearch';

export function GlobalSearchScreen() {
  const searchState = useGlobalSearch();
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchState.execute();
  }
  return (
    <main aria-labelledby="global-search-title">
      <h1 id="global-search-title">Global Search</h1>
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="global-search-query">Search</label>
        <input id="global-search-query" value={searchState.query} onChange={(event) => searchState.setQuery(event.target.value)} placeholder="Search across AXIVON ONE" autoComplete="off" />
        <button type="submit" disabled={searchState.loading || !searchState.query.trim()}>{searchState.loading ? 'Searching…' : 'Search'}</button>
      </form>
      {searchState.error && <section role="alert"><p>{searchState.error}</p><button type="button" onClick={() => void searchState.execute()}>Retry</button></section>}
      {!searchState.loading && !searchState.error && searchState.submittedQuery && searchState.results.length === 0 && <p role="status">No results found for “{searchState.submittedQuery}”.</p>}
      {searchState.results.length > 0 && <section aria-live="polite" aria-label="Search results"><p>{searchState.total} result{searchState.total === 1 ? '' : 's'}</p><ul>{searchState.results.map((result) => <li key={result.id}>{result.href ? <a href={result.href}>{result.title}</a> : <span>{result.title}</span>}{result.description && <p>{result.description}</p>}</li>)}</ul></section>}
    </main>
  );
}
