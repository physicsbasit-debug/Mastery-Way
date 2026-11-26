/** Select page breaks above text and table rows whenever possible. */
export function paginateReport(height: number, pageHeight: number, protectedRanges: Array<[number, number]>): Array<[number, number]> {
  if (!Number.isFinite(height) || !Number.isFinite(pageHeight) || height <= 0 || pageHeight <= 0) return [];
  // Only keep blocks together when they fit on a page; taller blocks must be
  // allowed to flow so pagination always makes progress.
  const ranges = protectedRanges.filter(([top, bottom]) => Number.isFinite(top) && Number.isFinite(bottom) && bottom > top && bottom - top <= pageHeight);
  const pages: Array<[number, number]> = [];
  let start = 0;
  while (start < height) {
    let end = Math.min(start + pageHeight, height);
    if (end < height) {
      let previous: number;
      do {
        previous = end;
        for (const [top, bottom] of ranges) {
          if (top < end && bottom > end && top > start) end = top;
        }
      } while (end < previous);
    }
    pages.push([start, end]);
    start = end;
  }
  return pages;
}

/**
 * Exam-only last-page guard: avoid creating an almost empty signature page
 * when the report can safely fit within A4's physical margins.
 *
 * The PDF draws 794px of content into 198mm at x=6mm. At 1140px height
 * it consumes 284.3mm, leaving over 6mm at the foot of the 297mm sheet.
 * Never alter the mastery or individual pagination through this helper.
 */
export function paginateExamWithoutSignatureOrphan(
  height: number,
  protectedRanges: Array<[number, number]>,
  signatureTop: number | null,
): Array<[number, number]> {
  const normal = paginateReport(height, 1088, protectedRanges);
  if (!Number.isFinite(signatureTop) || signatureTop === null || normal.length < 2) return normal;
  const [lastStart, lastEnd] = normal[normal.length - 1];
  const hasSignatureOnlyTail = lastEnd - lastStart <= 260
    && signatureTop >= lastStart - 80
    && signatureTop < lastEnd;
  if (!hasSignatureOnlyTail) return normal;

  // Increase page capacity by the smallest safe amount, and only when it
  // actually removes the nearly empty final page.
  for (const pageHeight of [1100, 1112, 1124, 1136, 1140]) {
    const candidate = paginateReport(height, pageHeight, protectedRanges);
    if (candidate.length < normal.length) return candidate;
  }
  return joinSignatureOnlyLastPage(normal, signatureTop);
}

/**
 * The true exam report can have a 1064px penultimate slice and a 126px
 * signature-only tail. Increasing page height does not solve this when an
 * earlier protected block forces a break. Join only those final two slices;
 * PdfExport uniformly scales this one merged image (at most 5%) to fit A4.
 * All source pixels remain present and all other pages stay unchanged.
 */
export function joinSignatureOnlyLastPage(
  pages: Array<[number, number]>,
  signatureTop: number | null,
): Array<[number, number]> {
  if (signatureTop === null || !Number.isFinite(signatureTop) || pages.length < 2) return pages;
  const [lastStart, lastEnd] = pages[pages.length - 1];
  const [previousStart, previousEnd] = pages[pages.length - 2];
  const tailHeight = lastEnd - lastStart;
  const joinedHeight = lastEnd - previousStart;
  if (previousEnd !== lastStart || tailHeight <= 0 || tailHeight > 180) return pages;
  if (signatureTop < lastStart - 20 || signatureTop >= lastEnd) return pages;
  // Never make the final text smaller than 95% of its original size.
  if (joinedHeight > 1200 || joinedHeight <= 0) return pages;
  return [...pages.slice(0, -2), [previousStart, lastEnd]];
}
