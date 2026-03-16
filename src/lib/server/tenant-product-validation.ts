import { z } from 'zod';

const MAX_PRODUCT_PRICE = 1_000_000;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export const tenantProductPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(180, 'Product name is too long')
    .transform(normalizeText),
  description: z
    .string()
    .trim()
    .max(5000, 'Description is too long')
    .optional()
    .transform((value) => normalizeText(value || '')),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .finite('Price must be finite')
    .nonnegative('Price cannot be negative')
    .max(MAX_PRODUCT_PRICE, `Price cannot exceed ${MAX_PRODUCT_PRICE}`),
  category: z
    .string()
    .trim()
    .max(120, 'Category is too long')
    .optional()
    .transform((value) => normalizeText(value || '')),
  imageUrls: z
    .array(z.string().url('Invalid image URL').max(2048, 'Image URL is too long'))
    .max(20, 'Too many product images')
    .optional()
    .transform((urls) => Array.from(new Set(urls || []))),
  featured: z.boolean().optional().default(false),
  stock: z.coerce
    .number({ invalid_type_error: 'Stock must be a number' })
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative')
    .nullable()
    .optional(),
});

export type TenantProductPayload = z.infer<typeof tenantProductPayloadSchema>;
