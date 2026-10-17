import { z } from 'zod';
import { CONTENT_FIELDS, CONTENT_KEYS } from '@/lib/storefront/content';
import { FONT_IDS } from '@/lib/storefront/font-ids';
import { CARD_STYLES, FOOTER_STYLES, STYLE_PRESET_IDS } from '@/lib/storefront/presets';
import { RUBRO_IDS } from '@/lib/storefront/rubros';
import { HERO_MODES } from '@/lib/storefront/theme';

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Invalid hex color');

const optionalUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL is too long')
  .optional()
  .transform((value) => value || '')
  .refine((value) => !value || /^https?:\/\//i.test(value), 'Invalid URL');

const optionalHandleOrUrlSchema = z
  .string()
  .trim()
  .max(120, 'Social handle is too long')
  .optional()
  .transform((value) => value || '');

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(24, 'Phone number is too long')
  .optional()
  .transform((value) => value || '')
  .refine((value) => !value || /^[+0-9\s()-]+$/.test(value), 'Invalid phone number');

const heroSlideSchema = z.object({
  id: z.string().trim().min(1).max(80),
  image: z.string().trim().max(2048).url('Invalid hero slide image URL'),
  title: z.string().trim().max(140).optional().default(''),
  subtitle: z.string().trim().max(280).optional().default(''),
  buttonText: z.string().trim().max(60).optional().default(''),
  order: z.coerce.number().int().min(0).max(100).optional(),
});

const storefrontContentSchema = z
  .object(
    Object.fromEntries(
      CONTENT_KEYS.map((key) => [key, z.string().trim().max(CONTENT_FIELDS[key].max).optional()])
    ) as Record<(typeof CONTENT_KEYS)[number], z.ZodOptional<z.ZodString>>
  )
  .strict();

/** Diseño de la vitrina (ver src/lib/storefront/theme.ts). Solo se aceptan valores conocidos. */
export const storefrontSettingsSchema = z
  .object({
    rubro: z.enum(RUBRO_IDS).optional(),
    style: z.enum(STYLE_PRESET_IDS).optional(),
    colors: z
      .object({ background: hexColorSchema.optional(), text: hexColorSchema.optional() })
      .strict()
      .optional(),
    fonts: z
      .object({ heading: z.enum(FONT_IDS).optional(), body: z.enum(FONT_IDS).optional() })
      .strict()
      .optional(),
    layout: z
      .object({
        hero: z.enum(HERO_MODES).optional(),
        gridColumns: z.union([z.literal(3), z.literal(4)]).optional(),
        cardStyle: z.enum(CARD_STYLES).optional(),
        footer: z.enum(FOOTER_STYLES).optional(),
        showStock: z.boolean().optional(),
      })
      .strict()
      .optional(),
    content: storefrontContentSchema.optional(),
  })
  .strict();

export const tenantSettingsPatchSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long').optional(),
    logo: optionalUrlSchema,
    primaryColor: hexColorSchema.optional(),
    whatsapp: optionalPhoneSchema,
    domain: z
      .union([
        z
          .string()
          .trim()
          .max(253)
          .regex(/^[a-zA-Z0-9.-]+$/, 'Invalid domain format'),
        z.null(),
      ])
      .optional(),
    subdomain: z
      .union([
        z
          .string()
          .trim()
          .max(63)
          .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Invalid subdomain format'),
        z.null(),
      ])
      .optional(),
    colors: z
      .object({
        primary: hexColorSchema,
        secondary: hexColorSchema,
        accent: hexColorSchema.optional(),
      })
      .optional(),
    socialMedia: z
      .object({
        instagram: optionalHandleOrUrlSchema,
        facebook: optionalHandleOrUrlSchema,
        tiktok: optionalHandleOrUrlSchema,
      })
      .optional(),
    heroSlides: z.array(heroSlideSchema).max(10, 'Too many hero slides').optional(),
    seoTitle: z.string().trim().max(70, 'SEO title is too long').optional(),
    seoDescription: z.string().trim().max(170, 'SEO description is too long').optional(),
    storefront: storefrontSettingsSchema.optional(),
  })
  .passthrough();

export type TenantSettingsPatchPayload = z.infer<typeof tenantSettingsPatchSchema>;
