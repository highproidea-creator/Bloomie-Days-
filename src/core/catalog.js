/** Search and paginate without coupling the full catalog to the 3D shelf. */
export function getCatalogPage(catalog, { query = '', page = 0, pageSize = 10 } = {}) {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('pageSize must be a positive integer');
  const term = query.trim().normalize('NFC').toLocaleLowerCase();
  const filtered = catalog.filter(flower => `${flower.name} ${flower.english} ${flower.family}`.normalize('NFC').toLocaleLowerCase().includes(term));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.max(0, Math.min(Number.isFinite(page) ? Math.floor(page) : 0, pageCount - 1));
  const start = current * pageSize;
  return { entries: filtered.slice(start, start + pageSize), total: filtered.length, page: current, pageCount, start: filtered.length ? start + 1 : 0, end: Math.min(start + pageSize, filtered.length) };
}
