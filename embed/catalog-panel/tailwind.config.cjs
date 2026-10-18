/*
 * Tailwind del editor <catalog-panel>. Los colores, radios y tamaños salen de las variables
 * --cm-* de CyberPOS (cyberposapp/src/styles.css), así el componente se ve como
 * parte del ERP. Cada una lleva su valor de respaldo para la página de prueba.
 * La tipografía es la del ERP (--font-family). El ancho lo da el contenedor
 * (container queries), no la pantalla: el ERP tiene menú lateral.
 */
module.exports = {
  content: [__dirname + '/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-family, "Plus Jakarta Sans")', 'system-ui', 'sans-serif'] },
      colors: {
        cm: {
          primary: 'var(--cm-primary, #10b981)',
          'primary-strong': 'var(--cm-primary-strong, #059669)',
          'primary-deep': 'var(--cm-primary-deep, #0f766e)',
          'primary-bg': 'var(--cm-primary-bg, rgba(16, 185, 129, 0.1))',
          'primary-line': 'var(--cm-primary-line, rgba(16, 185, 129, 0.3))',
          ink: 'var(--cm-ink, #0f172a)',
          'ink-soft': 'var(--cm-ink-soft, #334155)',
          subtle: 'var(--cm-subtle, #475569)',
          muted: 'var(--cm-muted, #64748b)',
          faint: 'var(--cm-faint, #94a3b8)',
          surface: 'var(--cm-surface-strong, rgba(255, 255, 255, 0.75))',
          field: 'var(--cm-field, rgba(255, 255, 255, 0.9))',
          line: 'var(--cm-line, rgba(148, 163, 184, 0.25))',
          danger: 'var(--cm-danger, #dc2626)',
          'danger-bg': 'var(--cm-danger-bg, rgba(220, 38, 38, 0.1))',
          warn: 'var(--cm-warn, #92400e)',
          'warn-bg': 'var(--cm-warn-bg, rgba(245, 158, 11, 0.12))',
          info: 'var(--cm-info, #0284c7)',
          'info-bg': 'var(--cm-info-bg, #e0f2fe)',
        },
      },
      borderRadius: {
        'cm-sm': 'var(--cm-radius-sm, 0.5rem)',
        'cm-md': 'var(--cm-radius-md, 0.7rem)',
        'cm-lg': 'var(--cm-radius-lg, 1.25rem)',
      },
      fontSize: {
        'cm-caption': 'var(--cm-fs-caption, 0.72rem)',
        'cm-label': 'var(--cm-fs-label, 0.78rem)',
        'cm-body': 'var(--cm-fs-body, 0.85rem)',
        'cm-title': 'var(--cm-fs-title, 1.05rem)',
        'cm-display': 'var(--cm-fs-display, 1.35rem)',
      },
    },
  },
  plugins: [require('@tailwindcss/container-queries')],
};
