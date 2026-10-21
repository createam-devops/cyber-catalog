# Migración de una tienda de Firebase al ERP

Pasa una tienda vieja (Firestore central + su propio proyecto Firebase) a una tienda del ERP: productos, categorías y fotos van a CyberPOS por su API; la presentación (logo, colores, redes, íconos y orden de categorías, dirección, visitas) va a la base del catálogo (`DATA_DIR/catalog.db`). Contexto y acuerdos: `cyberERP/PETICION_ERP_AL_CATALOGO_MIGRACION.md` (C-3 y C-4).

| Script | Dónde corre | Qué hace |
|---|---|---|
| `exportar-ficha.cjs` | contenedor de producción | Lee la ficha de la tienda del Firestore central (solo lectura) |
| `migrar-tienda.mjs` | cualquier equipo con la credencial de la app | Alta del negocio (A.1), categorías, productos, fotos y comprobación (A.5). Se puede repetir sin duplicar |
| `importar-presentacion.mjs` | donde esté la base del catálogo | Crea o actualiza la fila de la tienda en `stores`. `--deshacer` la borra |

La ficha y el reporte del migrador traen datos personales y la clave inicial del dueño: se guardan fuera del repositorio y no se pegan en chats.

## Antes del corte en producción

- El ERP de producción tiene A.1 y A.5 (E-6), y la credencial de la app trae `catalog.products.manage`, `catalog.categories.manage` y «Puede dar de alta negocios».
- Está el código del plan Básico de producción (E-5).
- El `.env` del catálogo apunta al ERP de producción (`ERP_API_BASE_URL`).
- El dueño confirmó el correo con el que entrará a CyberPOS y su WhatsApp real (en la ficha de Bella Sorpresa es el marcador `51999999999`, que los scripts ignoran).

## Pasos (Bella Sorpresa: `Gq4xtoalZu8hkiBum2cB`)

1. **Ficha**, desde el VPS:
   ```sh
   docker exec -i createam-platform node - Gq4xtoalZu8hkiBum2cB < exportar-ficha.cjs > ficha.json
   ```
2. **Ensayo en seco** (solo lee Firebase):
   ```sh
   node scripts/migracion-firebase/migrar-tienda.mjs --ficha ficha.json --plan <básico> --dry-run --salida seco.json
   ```
3. **Migración** con la credencial de la app (`--env` es un archivo con `ERP_API_BASE_URL` y `ERP_APP_CLIENT_SECRET` de producción):
   ```sh
   node scripts/migracion-firebase/migrar-tienda.mjs --ficha ficha.json --plan <básico> --env .env.prod \
     --telefono +51XXXXXXXXX --salida reporte.json
   ```
   Debe terminar con `Comprobación: 26/26 productos, 39/39 fotos, 0 diferencias`. Si se corta, se vuelve a correr igual; si el correo ya existe en el ERP, se detiene y lo resuelve el equipo del ERP.
4. **Presentación**, en el contenedor (la tienda conserva su id de Firebase; desde ese momento su dirección lee el ERP):
   ```sh
   docker exec createam-platform mkdir -p /tmp/migracion
   docker cp scripts/migracion-firebase/importar-presentacion.mjs createam-platform:/tmp/migracion/
   docker cp ficha.json createam-platform:/tmp/migracion/
   docker cp reporte.json createam-platform:/tmp/migracion/
   docker cp logo.webp createam-platform:/tmp/migracion/
   docker exec -w /app createam-platform node /tmp/migracion/importar-presentacion.mjs \
     --ficha /tmp/migracion/ficha.json --migracion /tmp/migracion/reporte.json --logo /tmp/migracion/logo.webp
   docker exec createam-platform rm -rf /tmp/migracion
   ```
   Con `--sin-direccion` la fila queda sin subdominio ni dominio, para revisarla antes de cambiar la dirección.
5. **Revisar** la vitrina, `/sitemap.xml` y `/robots.txt` en `bellasorpresa.createam.cloud` (la caché del catálogo dura un minuto).

**Vuelta atrás** (mientras Firebase siga encendido): `importar-presentacion.mjs --deshacer Gq4xtoalZu8hkiBum2cB` borra la fila y su logo, y la dirección vuelve a la tienda de Firebase. Lo subido al ERP queda allí; repetir la migración no lo duplica.
