export interface SearchQueryParams {
  query: string;
  modules?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResultItem {
  id: string;
  module: string;
  title: string;
  description?: string;
  url: string;
  score: number;
}
