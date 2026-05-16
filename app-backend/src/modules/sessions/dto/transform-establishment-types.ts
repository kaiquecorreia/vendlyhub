import { Transform } from 'class-transformer';

/** Multipart / JSON: coerces repeated fields or a single string into string[]. */
export function TransformToEstablishmentTypes(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((s) => s.length > 0);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return [value.trim()];
    }
    return undefined;
  });
}
