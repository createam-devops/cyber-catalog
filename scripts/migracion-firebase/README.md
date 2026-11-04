# Migración de una tienda de Firebase al ERP

Pasa una tienda vieja de Firebase a una tienda del ERP:
- productos, categorías y fotos van a CyberPOS por su API;
- la presentación (logo, colores, redes, SEO, íconos y orden de categorías, dirección) va a la base del catálogo (`DATA_DIR/catalog.db`).

Contexto y acuerdos: `cyberERP/PETICION_ERP_AL_CATALOGO_MIGRACION.md` (C-3 y C-4).

| Archivo | Dónde corre | Qué hace |
|---|---|---|
| `exportar-ficha.cjs` | contenedor de producción | Lee la ficha de la tienda del Firestore central (solo lectura). De ahí salen su Firebase y su id |
| `bellasorpresa-pe.json` | — | La presentación de la tienda real, con los datos públicos de bellasorpresa.pe |
| `migrar-tienda.mjs` | cualquier equipo con la credencial de la app | Alta del negocio (A.1), categorías, productos, fotos y comprobación (A.5). Se puede repetir sin duplicar |
| `importar-presentacion.mjs` | donde esté la base del catálogo | Crea o actualiza la fila del negocio en `stores`. `--deshacer` la borra |

La ficha y el reporte del migrador traen datos personales y la clave inicial del dueño. Se guardan fuera del repositorio y no se pegan en chats.

## Bella Sorpresa

**La tienda real es bellasorpresa.pe** (repo `tiktok-shop-link`, publicada en Hostinger).
- Lee sus productos del Firebase `createam-5a670`. Son los que se migran.
- La ficha del Firestore central (`Gq4xtoalZu8hkiBum2cB`, en `bellasorpresa.createam.cloud`) es de prueba.
  - De ella solo se usan el Firebase y el id, que va en las `external_ref`.
  - Su logo, colores, WhatsApp y redes no son los reales.
  - Esa tienda de prueba sigue en Firebase hasta que se apague.

**La presentación sale de `bellasorpresa-pe.json`:**
- con el dominio `bellasorpresa.pe` y **sin subdominio**, para no publicar en createam.cloud una copia de la tienda real;
- la vitrina de la tienda real sigue siendo `tiktok-shop-link`, que leerá del catálogo (C-8).

## Antes del corte en producción

- El ERP de producción tiene A.1 y A.5 (E-6).
- La credencial de la app trae `catalog.products.manage`, `catalog.categories.manage` y «Puede dar de alta negocios».
- Están los planes de producción (E-5) y el negocio de Bella Sorpresa creado por el operador.
- El `.env` del catálogo en el VPS apunta al ERP de producción: `ERP_API_BASE_URL`, `ERP_APP_URL`, el secreto de la app, el de avisos y `ERP_SIGNUP_PLAN_CODE` con el plan de producción.
- El PR del orden de categorías está fusionado.

## Pasos

1. **Ficha**, desde el VPS:
   ```sh
   docker exec -i createam-platform node - Gq4xtoalZu8hkiBum2cB < exportar-ficha.cjs > ficha.json
   ```
2. **Ensayo en seco** (solo lee Firebase):
   ```sh
   node scripts/migracion-firebase/migrar-tienda.mjs --ficha ficha.json \
     --presentacion scripts/migracion-firebase/bellasorpresa-pe.json --plan <básico> --dry-run --salida seco.json
   ```
3. **Migración**, con la credencial de la app. `--env` es un archivo con `ERP_API_BASE_URL` y `ERP_APP_CLIENT_SECRET` de producción.

   **Camino recomendado por el ERP** (`RUNBOOK_PROMOCION_CATALOGO.md` §4):
   1. El operador crea el negocio en Plataforma › Negocios › Nuevo negocio, con su plan, «De cortesía» y el correo de la dueña.
   2. El migrador lo llena con `--negocio`, sin alta. Antes de escribir muestra el nombre, el plan y los límites del negocio; el ensayo en seco también los muestra.
      ```sh
      node scripts/migracion-firebase/migrar-tienda.mjs --ficha ficha.json \
        --presentacion scripts/migracion-firebase/bellasorpresa-pe.json --negocio <id> --env .env.prod.local \
        --correo-dueno <correo> --salida reporte.json
      ```

   **Con alta por la app (A.1)**, si en prod ya hay plan de caída o días de prueba: cambiar `--negocio <id>` por `--plan <código> --nombre-dueno "<nombre>"`. Si el correo ya existe en el ERP, se detiene y lo resuelve el equipo del ERP.

   En los dos casos:
   - **Producción rechaza fotos de más de ~1 MB (413)** mientras el ERP no suba ese tope. Usar `--reducir-fotos`: cada foto va como WebP de 1600 px como máximo, el tamaño que guarda el ERP. Usarlo siempre igual para una misma tienda.
   - Debe terminar con `Comprobación: 26/26 productos, 39/39 fotos, 0 diferencias`.
   - Si se corta, se vuelve a correr igual.
4. **Presentación**, en el contenedor. El logo es `tiktok-shop-link/public/brand-logo.webp`.
   ```sh
   docker exec createam-platform mkdir -p /tmp/migracion
   docker cp scripts/migracion-firebase/importar-presentacion.mjs createam-platform:/tmp/migracion/
   docker cp scripts/migracion-firebase/bellasorpresa-pe.json createam-platform:/tmp/migracion/
   docker cp reporte.json createam-platform:/tmp/migracion/
   docker cp brand-logo.webp createam-platform:/tmp/migracion/
   docker exec -w /app createam-platform node /tmp/migracion/importar-presentacion.mjs \
     --presentacion /tmp/migracion/bellasorpresa-pe.json --migracion /tmp/migracion/reporte.json \
     --logo /tmp/migracion/brand-logo.webp
   docker exec createam-platform rm -rf /tmp/migracion
   ```
   Imprime el id de la tienda nueva.
5. **Revisar** en el editor de CyberPOS (Venta online › Tienda): productos, logo, colores y redes.

**Vuelta atrás:**
- `importar-presentacion.mjs --deshacer <id>` borra la fila y su logo.
- Lo subido al ERP queda allí, y repetir la migración no lo duplica.
- `tiktok-shop-link` sigue leyendo Firebase hasta C-8, así que la tienda real no se entera.
