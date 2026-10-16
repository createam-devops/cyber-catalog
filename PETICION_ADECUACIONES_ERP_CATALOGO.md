# Petición de adecuaciones al ERP para el Catálogo Digital

**De:** equipo Catálogo Digital (`createam-platform`) · **Para:** equipo cyberERP
**Fecha:** 2026-10-16
**Referencias:** `ANALISIS_PRODUCTO_ECOMMERCE.md`, `IMPLEMENTATION_PLAN_PRODUCTO_ECOMMERCE.md`, `PROPUESTA_SSO_CREATEAM.md` / `RESPUESTA_ERP_SSO.md`, integración de OnTurn (`ONTURN_AUTH_INTEGRATION.md`, `ESTRATEGIA_IDENTIDAD_Y_ALTA.md`).
**Objeto:** el Catálogo Digital deja Firebase y pasa a usar el ERP como fuente de verdad de negocios, accesos y productos. Pedimos lo mínimo para que:

1. un negocio se dé de alta solo, sin intervención manual;
2. su dueño entre al panel del catálogo con su usuario del ERP;
3. la vitrina pública lea sus productos;
4. el dueño cargue y edite productos desde el panel del catálogo.

Todo lo pedido es genérico: sirve a cualquier vitrina o canal de venta externo, no solo al catálogo, en línea con el contrato de ventas externas que ya usa OnTurn.

---

## Contexto

**Hoy.** Next.js multi-tenant en `*.createam.cloud` (y dominios propios). Cada tienda tiene **su propio proyecto Firebase, creado a mano**, y el dueño entra con Firebase Auth. El pedido se cierra por WhatsApp: no hay pagos en línea. Planes: Starter (S/ 9.90, 30 productos, 5 categorías, 5 fotos por producto) y Pro (S/ 19.90, sin límites, stock visible). Prueba gratis de 30 días.

**Destino.**

```
 Visitante ──► Vitrina (Next.js, servidor) ──caché──► api-gateway /integrations/catalog/*
                     │                                         │
                     │ fotos directas                          └─► inventory-ms (productos, stock)
                     └──────────────────────────────► /media/* (público, WebP)

 Dueño ──► Panel del catálogo ──► /auth/login (app "catalog") ──► auth-ms (JWKS)
                     └──────────────► /integrations/catalog/* (escritura)
```

- **Pasa al ERP:** el negocio (`partner`), el dueño y sus accesos, productos, categorías, marcas, fotos y stock.
- **Se queda en el catálogo:** solo la presentación de la vitrina (subdominio y dominio, rubro, diseño, textos, banners, WhatsApp, SEO), en una base propia enlazada por `erp_partner_id`, igual que OnTurn.
- **El navegador del visitante nunca llama al ERP.** El servidor de la vitrina llama al gateway y guarda las respuestas en caché. Las fotos sí se sirven directo desde `/media`.
- **Volumen esperado:** catálogos de 20 a 500 productos, muchas lecturas (visitas) y pocas escrituras.

---

## A. Faltantes críticos (sin esto no hay catálogo sobre el ERP)

### A.1 Alta de un negocio con plan de catálogo — 🔴 agregar

`POST /api/v1/auth/register` solo acepta los perfiles `products` → `free_products` y `services` → `free_services` (`api-gateway/internal/gateway/public_signup.go:26-29`). Los endpoints `/admin/partners*` aceptan cualquier plan, pero exigen un usuario con `platform.partners.manage`: no los puede llamar un servidor.

**Pedido:**
- **Planes de catálogo** con su código (proponemos `catalog_starter` y `catalog_pro`):
  - módulos mínimos para productos (el equivalente de `inventory` + `settings` de `free_products`, `024_free_tiers.sql`);
  - la app `catalog` en `plan_apps` (ver A.2);
  - `max_products` según la tabla de arriba.
- **Alta de servidor a servidor.** Recomendamos `POST /api/v1/integrations/partners`, que ya está previsto en `ESTRATEGIA_IDENTIDAD_Y_ALTA.md`. Lo autentica la credencial de la app (ver A.6). La alternativa sería aceptar `profile: "catalog"` en `/auth/register`.
  - Preferimos la primera porque el catálogo **ya verifica el correo** con un código antes del alta, y necesita crear el negocio desde su servidor.

```json
POST /api/v1/integrations/partners
{
  "app": "catalog",
  "plan_code": "catalog_starter",
  "business_name": "Ferretería El Tornillo",
  "owner": { "name": "Juan Pérez", "email": "juan@correo.pe", "password": "…", "phone": "+51987654321" },
  "email_verified": true,
  "trial_days": 30,
  "external_ref": "catalog-signup-7f3a…"
}
→ 201 { "partner_id": 123, "user_id": 456, "plan_code": "catalog_starter", "trial_ends_at": "2026-11-15T…Z" }
```

- **Idempotente** por `external_ref`, y un 409 claro si el correo ya existe.
- **Lo mismo que hoy hace `/auth/register`:** clonar roles, unidades base y almacén `ALM-01`.

### A.2 App `catalog` para el ingreso del dueño — 🔴 configurar (sin código nuevo, a confirmar)

Replicamos el ingreso de OnTurn tal cual: `POST /auth/login` con `app: "catalog"` desde el servidor del catálogo, verificación contra `/.well-known/jwks.json` con `aud=catalog`, y sesión propia en cookie. El token del ERP nunca llega al navegador.

**Pedido:**
- una fila `catalog` en `client_apps` con `aud=catalog` (como `onturn` en `016_client_apps.sql`);
- enlazarla a los planes de A.1 en `plan_apps`.
- **Confirmar** que no hace falta nada más del lado del ERP.

### A.3 Lectura de productos para la vitrina — 🔴 agregar

Hoy no hay forma de que un sistema externo lea productos:
- `/inventory/products` y `/catalog/*` exigen el JWT de un usuario;
- los tokens de servicio no pueden llevar permisos de inventario (`delegableAgentPermission`, `api-gateway/internal/gateway/agent_token_policy.go:20-31`);
- `/integrations` solo expone el catálogo de **servicios** (`IntegrationServiceCatalog`, `integrations_handlers.go:520`).

**Pedido:** el mismo patrón que `/integrations/service-catalogs`, pero para productos:

| Método y ruta | Uso |
|---|---|
| `GET /api/v1/integrations/catalog/products` | Listado de la vitrina. Filtros: `category_id`, `q`, `featured`, `updated_since`. Paginación: `page_size` (máx. 100) y `cursor` |
| `GET /api/v1/integrations/catalog/products/{id}` | Detalle del producto |
| `GET /api/v1/integrations/catalog/categories` | Categorías y subcategorías con al menos un producto publicado |
| `GET /api/v1/integrations/catalog/brands` | Opcional |

Forma esperada de un producto:

```json
{
  "id": 9812,
  "code": "P-00031",
  "name": "Taladro percutor 650W",
  "description": "…",
  "category": { "id": 14, "name": "Herramientas eléctricas" },
  "subcategory": { "id": 52, "name": "Taladros" },
  "brand": { "id": 7, "name": "Bosch" },
  "sale_price": 289.90,
  "currency": "PEN",
  "stock_available": 12,
  "images": [
    { "id": 1, "url": "https://api.createam.cloud/media/…/1600.webp", "thumb_url": "…/200.webp",
      "width": 1600, "height": 1600, "alt": "…", "is_primary": true, "sort_order": 0 }
  ],
  "parent_product_id": null,
  "variant_attributes": null,
  "published": true,
  "featured": false,
  "sort_order": 3,
  "updated_at": "2026-10-16T15:04:05Z"
}
```

- **Partner:** se toma de la credencial (A.6), como hoy, y nunca del request.
- **Qué productos:** solo los activos y publicados en el canal `catalog` (A.4), salvo que el panel pida `include_unpublished=true` con permiso de escritura.
- **Orden estable:** `sort_order` y después `updated_at`. `updated_since` permite sincronizar por partes.
- **Permiso:** nuevo permiso delegable `catalog.products.view`.

### A.4 "Publicado en el catálogo" por producto — 🔴 agregar (subconjunto de F4)

No existe ninguna marca de publicación, de destacado ni de orden para canales. El `is_featured` del índice de catálogo es `quick_sale_order > 0`, es decir, un favorito del POS. F4 propone `product_listings` (`ANALISIS_PRODUCTO_ECOMMERCE.md:74`).

**Pedido:** el mínimo de F4 para el canal `catalog`, en `product_listings` o donde lo prefieran:
- `published` (bool), `featured` (bool) y `sort_order` (int);
- opcionales: `slug` y precio tachado.

Editable desde dos lados:
- la sección "Venta online" del formulario de producto de CyberPOS (`cyberposapp/…/product-form-panel.html:191`);
- la API (A.5).

**Reglas por defecto a confirmar:**
- un producto creado desde el catálogo nace publicado;
- uno creado desde el POS nace sin publicar.

### A.5 Escritura de productos desde el panel del catálogo — 🔴 agregar

El cliente del catálogo (S/ 9.90) necesita un editor simple: nombre, precio, categoría, descripción y fotos. El asistente de alta incluye el paso "carga tus primeros productos". Mandarlo a la pantalla de inventario del ERP es demasiado para este perfil. Un negocio que además usa el POS puede seguir editando ahí: es el mismo dato.

**Pedido:**

| Método y ruta | Uso |
|---|---|
| `POST /api/v1/integrations/catalog/products` | Crear con lo mínimo: `name`, `sale_price`, `category_id`, `description` y `published`. El ERP pone los valores por defecto: unidad `UND`, afectación de IGV por defecto del negocio, almacén `ALM-01` y `code` automático |
| `PATCH /api/v1/integrations/catalog/products/{id}` | Editar, incluido `published`, `featured`, `sort_order` y el stock si el plan lo permite |
| `DELETE /api/v1/integrations/catalog/products/{id}` | Baja lógica (`is_active=false`) |
| `POST /api/v1/integrations/catalog/products/{id}/images` | Subida multipart que reusa la tubería de la galería (WebP 1600/800/200) |
| `DELETE …/images/{image_id}` y `PATCH …/images/order` | Quitar fotos y reordenarlas |
| `POST` y `PATCH /api/v1/integrations/catalog/categories` | Crear y renombrar categorías |

- **Límites de plan:** respetar `max_products` y el número de fotos, con un código de error estable (por ejemplo `PLAN_LIMIT_PRODUCTS`) que el panel pueda mostrar.
- **Permisos delegables:** `catalog.products.manage` y `catalog.categories.manage`.
- **Eventos:** emitir los de producto de siempre (ver B.2).

### A.6 Credencial de servicio para el catálogo — 🔴 definir

OnTurn usa un token **por negocio** que el dueño genera y pega a mano:
- se emite en `POST /print-agent/tokens`;
- dura 90 días;
- exige el feature `api.full_access` (`agent_token_policy.go:87`).

En el catálogo el alta es automática y el cliente no es técnico, así que **no podemos pedirle al dueño que genere un token**.

**Opciones:**
1. **Credencial de aplicación (recomendada).** El catálogo tiene un `client_id`/`client_secret` de la app `catalog`. Con ellos pide un token corto para un negocio (`POST /integrations/app-token { "partner_id": 123 }`). El ERP solo lo emite si el plan del negocio incluye la app `catalog`, y con los permisos `catalog.*` fijos.
   - No hay secretos por negocio que guardar ni que venzan.
   - Revocar es quitar la app del plan.
2. **El alta (A.1) devuelve un token de servicio del negocio** con permisos `catalog.*`, más un endpoint para rotarlo.

En ambos casos, **sin exigir `api.full_access`** para estos permisos: un plan de S/ 9.90 no lo tendría.

---

## B. Definiciones necesarias para construir

### B.1 Recuperar contraseña y verificar el correo — 🟡 (🔴 para abrir el alta autoservicio)

Hoy solo un administrador puede cambiar la contraseña de un usuario. La verificación de correo está comentada (`auth-microservice/internal/domain/usecase/auth_usecase.go:235-238`), y el flag `FEATURE_EMAIL_VERIFICATION` no hace nada. Un cliente que se registró solo no tiene cómo recuperar su acceso.

**Pedido (definir el camino):**
- **(a) En auth-ms:**
  - `POST /auth/password/forgot { email, app }`, que envía un enlace o código desde notification-orchestrator, o le devuelve al catálogo un token de un solo uso para que él envíe el correo;
  - `POST /auth/password/reset { token, new_password }`.
- **(b) Esperar F2 del SSO**, cuando los accesos pasen a Zitadel. En ese caso, ¿cuál es la fecha?
- Confirmar que `email_verified: true` en A.1 se respeta, porque el catálogo ya verificó el correo con un código.

### B.2 Aviso de cambios para refrescar la vitrina — 🟡

inventory-ms publica `product.*` y `stock.*` en NATS (`internal/adapter/nats/event_publisher.go`). Pero el despachador de webhooks de integración solo reenvía `service_order.>` (`api-gateway/internal/gateway/integration_webhooks.go:88`). Además, los cambios de fotos, de categorías y de marcas no emiten eventos.

**Pedido:**
- ampliar el despachador a `product.>` y `stock.>`, firmado con HMAC como los actuales;
- emitir eventos al cambiar fotos, categorías y la publicación (A.4).
- **Payload mínimo:** `type`, `partner_id`, `product_id` y `updated_at`.
- **Definir** si la URL de callback es **una por app** (la preferimos: el catálogo atiende a todos sus negocios en una sola URL) o una por negocio.

Mientras no exista, el catálogo usa una caché de 60 s más `updated_since`.

### B.3 Prueba gratis, vencimiento, suspensión y cobro — 🟡

**Proponemos:**
- el estado comercial del negocio (plan, fin de la prueba, suspensión) vive en el ERP;
- el catálogo lo consulta con `GET /integrations/partner`, que ya existe, para mostrar "tienda en pausa" al vencer.

**Pedido:**
- confirmar qué campos expone ese endpoint (`plan_code`, estado, `trial_ends_at`);
- definir el cobro: hoy el catálogo cobra con suscripciones de Mercado Pago. ¿Pasa al módulo de suscripciones del ERP (`IMPLEMENTATION_PLAN_SUSCRIPCIONES.md`) o se queda en el catálogo e informa al ERP?

### B.4 Negocios que ya usan CyberPOS — 🟡

Un negocio con POS que activa el catálogo conserva su `partner_id`; solo se le agrega la app `catalog`.

**Pedido:**
- confirmar cómo se habilita la app sin cambiarle el plan: ¿override por negocio, o un plan "POS + catálogo"?
- confirmar que sus productos existentes **no** aparecen en la vitrina hasta que se publiquen (A.4).

### B.5 Promoción a producción de F1–F3 — 🟡

Marcas, identidad online y galería de fotos están hechas solo en dev (`IMPLEMENTATION_PLAN_PRODUCTO_ECOMMERCE.md:136`). El catálogo depende de la galería y de `/media` en producción. **Pedido:** fecha estimada.

---

## C. Confirmaciones menores

| # | Punto | Pedido |
|---|---|---|
| C.1 | **URLs de foto** | Confirmar que las URLs son absolutas (`MEDIA_BASE_URL`) y cómo se pide cada tamaño (200/400/800/1200/1600). La vitrina usa el de 800 en la grilla y el de 1600 en el detalle. |
| C.2 | **Caché de `/media`** | Confirmar `Cache-Control` inmutable. El catálogo deja de reprocesar las fotos con su propio optimizador. |
| C.3 | **Precio** | ¿`sale_price` incluye IGV? La vitrina muestra el precio final al público. |
| C.4 | **Stock** | ¿`stock_available` es la suma de almacenes menos lo reservado, o solo `ALM-01`? Los productos sin control de stock deben dar `null`. |
| C.5 | **Variantes** | `parent_product_id` + `variant_attributes` (texto libre). El rubro "Moda y belleza" necesita talla y color: ¿hay un formato clave:valor que podamos leer? ¿Hay plan de variantes tipadas? |
| C.6 | **Límite de peticiones** | El catálogo llama por muchos negocios desde una sola IP. Confirmar que el límite es **por negocio** (`main.go:272-274`) y no por IP. |
| C.7 | **Moneda** | Confirmar que es PEN implícito por negocio o agregar `currency`. |
| C.8 | **Disponibilidad** | Si el gateway no responde, la vitrina sirve su última copia en caché. ¿Hay ventanas de mantenimiento o un canal de avisos? |

---

## D. Migración de las tiendas actuales

- **Bella Sorpresa:** 26 productos, 4 categorías y sus fotos en Firebase Storage.
- **Las demás tiendas activas del catálogo:** el listado se cerrará al momento de migrar.

**Propuesta:** el catálogo migra llamando a A.1 y A.5, sin tocar la base del ERP. Así, al terminar A.1, A.5 y A.6 podemos migrar y apagar Firebase.

---

## E. Resumen

| Prioridad | Item | Acción del ERP |
|---|---|---|
| 🔴 | A.1 Alta de negocio con plan de catálogo | planes `catalog_*` + `POST /integrations/partners` |
| 🔴 | A.2 App `catalog` | fila en `client_apps` + `plan_apps` |
| 🔴 | A.3 Lectura de productos | `GET /integrations/catalog/*` + permiso `catalog.products.view` |
| 🔴 | A.4 Publicado / destacado / orden | mínimo de F4 para el canal `catalog` |
| 🔴 | A.5 Escritura desde el catálogo | `POST/PATCH/DELETE /integrations/catalog/*` + fotos |
| 🔴 | A.6 Credencial de la app | definir: credencial de aplicación (recomendada) o token por negocio |
| 🟡 | B.1 Recuperar contraseña y verificar correo | en auth-ms o con F2 del SSO; definir fecha |
| 🟡 | B.2 Webhooks de producto | ampliar el despachador a `product.>` y `stock.>` |
| 🟡 | B.3 Prueba, vencimiento y cobro | confirmar campos y quién cobra |
| 🟡 | B.4 Negocios con POS | cómo se habilita la app sin cambiar el plan |
| 🟡 | B.5 F1–F3 en producción | fecha estimada |
| ⚪ | C.1–C.8 | confirmar en este documento |

**Orden sugerido:** A.2 y A.6 primero, porque desbloquean el ingreso y la lectura. Después A.3 y A.4, para que la vitrina lea del ERP; luego A.1 y A.5, con lo que el alta y el editor quedan completos. B.1 tiene que estar antes de abrir el alta al público.

---

## Lo que hace el catálogo mientras tanto

- Separa su acceso a datos en una "fuente de datos" con dos implementaciones (Firebase hoy, ERP después), para que el cambio no toque la vitrina.
- Construye el sistema de diseño parametrizable (estilos base, colores, tipografías, textos), los paquetes por rubro (regalos, moda y belleza, comida y bebidas, ferretería y tecnología) y el asistente de alta.
- Deja listo el ingreso con el ERP, copiado de OnTurn (`lib/panel/erpAuth.ts`), para activarlo apenas exista A.2.
