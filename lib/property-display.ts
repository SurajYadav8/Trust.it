import { formatAddress } from "@/lib/format";

export type PropertyRequestInfo = {
  title?: string;
  propertyLabel?: string;
  landlordAddress?: string;
} | null | undefined;

function looksLikeUnitIdentifier(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  if (/^(unit|property|apt|#)\s*/i.test(text)) return true;
  if (/^\d+[a-zA-Z]?$/.test(text)) return true;
  return text.length <= 8 && /\d/.test(text) && !/\s{2,}/.test(text);
}

function formatPropertyIdentifier(value: string): string {
  const text = value.trim();
  if (/^(unit|property|apt|#)\s*/i.test(text)) return text;
  if (/^\d+[a-zA-Z]?$/.test(text)) return `Property ${text}`;
  return text;
}

export function propertyDisplayInfo(
  request: PropertyRequestInfo,
  fallback = "Property"
): { name: string; identifier: string | null } {
  if (!request) return { name: fallback, identifier: null };

  const { title, propertyLabel } = request;

  if (title && propertyLabel) {
    const titleIsUnit = looksLikeUnitIdentifier(title);
    const labelIsUnit = looksLikeUnitIdentifier(propertyLabel);

    if (titleIsUnit && !labelIsUnit) {
      return {
        name: propertyLabel,
        identifier: formatPropertyIdentifier(title),
      };
    }

    if (labelIsUnit && !titleIsUnit) {
      return {
        name: title,
        identifier: formatPropertyIdentifier(propertyLabel),
      };
    }

    return {
      name: title,
      identifier: formatPropertyIdentifier(propertyLabel),
    };
  }

  const single = title ?? propertyLabel;
  if (!single) return { name: fallback, identifier: null };

  if (looksLikeUnitIdentifier(single)) {
    return {
      name: request.landlordAddress
        ? formatAddress(request.landlordAddress)
        : fallback,
      identifier: formatPropertyIdentifier(single),
    };
  }

  return { name: single, identifier: null };
}
