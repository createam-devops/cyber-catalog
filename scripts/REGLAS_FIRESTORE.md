# Reglas de Firestore del proyecto central

`firestore.rules` (raíz del repo) es la fuente de verdad de las reglas del
proyecto central (`cyber-catalog`): tiendas, usuarios y registros. Hasta octubre
de 2026 solo vivían en la consola de Firebase, sin historia ni revisión.

## Qué permiten

| Colección | Leer | Escribir |
|-----------|------|----------|
| `tenants/{id}` | Cualquiera, si la tienda está **activa**. Su administrador, en cualquier estado. Una consulta tiene que filtrar por `status == 'active'`. | Nadie desde el navegador: todo pasa por las rutas del servidor. |
| `users/{uid}` | Solo el propio usuario. | Nadie desde el navegador. |
| `pendingRegistrations/{email}` | Nadie. | Nadie. |

El servidor usa el Admin SDK, que no pasa por las reglas. La vitrina de una
tienda (`src/app/store/**`) lee la tienda con `src/lib/server/tenants.ts`, así
que **no depende** de la lectura pública: si algún día se cierra, las tiendas
siguen cargando.

## Publicarlas

Con las variables `FIREBASE_ADMIN_*` del servidor en el entorno:

```sh
node scripts/publicar-reglas.js --validar   # solo comprueba que compilan
node scripts/publicar-reglas.js             # valida y publica
node scripts/publicar-reglas.js --ver       # imprime las publicadas
```

Desde el VPS, usando las credenciales que ya tiene el contenedor (la imagen no
incluye `scripts/`, por eso se le pasan por la entrada estándar):

```sh
docker exec -i createam-platform sh -c 'cat > /tmp/firestore.rules' < firestore.rules
docker exec -i -w /app -e REGLAS=/tmp/firestore.rules createam-platform node - < scripts/publicar-reglas.js
```

## Deshacer

Firebase conserva cada conjunto publicado. El script imprime el nombre del
anterior antes de publicar:

```sh
node scripts/publicar-reglas.js --volver <nombre-del-ruleset>
```

Las reglas anteriores a este archivo (21-mar-2026) son el conjunto
`d3a22226-f7b7-46ae-a73c-5a1d941ebf55`. Exigían sesión para leer `tenants` —por
eso ninguna tienda cargaba— y dejaban que cualquier usuario con sesión
modificara cualquier tienda.

## Después de cambiarlas

Comprobar, sin sesión, que una tienda activa abre (`https://<tienda>.createam.cloud`)
y, con sesión de una tienda, que su panel `/tenant-admin` carga.
