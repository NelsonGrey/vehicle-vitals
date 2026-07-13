export interface DocumentExtracted {
  documentCategory?: string;
  serviceType?: string;
  totalCost?: number;
  serviceDate?: string;
  mileage?: number;
}

export function getSourceSnippet(
  sourceText: string | undefined,
  maxLength = 240
): string {
  if (!sourceText) return '';
  const compact = sourceText.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength)}...`;
}

export function buildDocumentSummary(
  extracted: DocumentExtracted | undefined,
  sourceText?: string
): string {
  if (!extracted) {
    const snippet = getSourceSnippet(sourceText, 120);
    return snippet || 'No analysis summary available yet';
  }

  const category = extracted.documentCategory
    ? extracted.documentCategory.replace(/_/g, ' ')
    : 'document';

  const details: string[] = [];
  if (extracted.serviceType) {
    details.push(extracted.serviceType);
  }
  if (typeof extracted.totalCost === 'number') {
    details.push(`$${extracted.totalCost.toFixed(2)}`);
  }
  if (extracted.serviceDate) {
    details.push(extracted.serviceDate);
  }
  if (typeof extracted.mileage === 'number') {
    details.push(`${extracted.mileage.toLocaleString()} mi`);
  }

  if (details.length > 0) {
    return `${titleCase(category)}: ${details.join(' • ')}`;
  }

  const snippet = getSourceSnippet(sourceText, 120);
  if (snippet) {
    return `${titleCase(category)}: ${snippet}`;
  }

  return `${titleCase(category)}: No key fields extracted yet`;
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map(token => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}
