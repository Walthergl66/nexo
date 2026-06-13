# nexo mobile

App Expo activa de nexo.

## Configuracion

```bash
cp .env.example .env
npm install
npm run start
```

Variables usadas por Expo:

```txt
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
EXPO_PUBLIC_SUPABASE_ACCESS_TOKEN=
```

El catalogo publico usa `GET /products`. Carrito, ordenes, perfil y tienda propia usan rutas protegidas de Laravel y requieren un JWT valido de Supabase en `EXPO_PUBLIC_SUPABASE_ACCESS_TOKEN` para pruebas manuales.

## Pruebas

```bash
npm run test
npm run typecheck
```
