/** Select page breaks above text and table rows whenever possible. */
export function paginateReport(height: number, pageHeight: number, protectedRanges: Array<[number, number]>): Array<[number, number]> {
  if (height <= 0 || pageHeight <= 0) return [];
  const pages: Array<[number, number]> = [];
  let start = 0;
  while (start < height) {
    let end = Math.min(start + pageHeight, height);
    if (end < height) {
      let previous: number;
      do {
        previous = end;
        for (const [top, bottom] of protectedRanges) {
          if (top < end && bottom > end && top > start + pageHeight * 0.25) end = top;
        }
      } while (end < previous);
    }
    pages.push([start, end]);
    start = end;
  }
  return pages;
}
