export const getFieldDescribedBy = (fieldId: string, hasError: boolean): string | undefined =>
  hasError ? `${fieldId}-error` : undefined;

export const getStatusAnnouncement = (message: string): string => message.trim();

export const getTableLabel = (entity: string, count: number): string =>
  `${entity} list, ${count} ${count === 1 ? 'item' : 'items'}`;
