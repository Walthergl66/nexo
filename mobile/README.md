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
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

El catalogo publico usa `GET /products`. La cuenta usa Supabase Auth directamente desde Expo y envia el JWT real al backend para carrito, ordenes, perfil y tienda propia.

## Pruebas

```bash
npm run test
npm run typecheck
```
