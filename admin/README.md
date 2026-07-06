# nexo admin

Panel web separado para el rol `admin`.

## Configuracion

1. Copia `.env.example` a `.env.local`.
2. Define `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Ajusta `NEXT_PUBLIC_API_BASE_URL` si Laravel no corre en `http://127.0.0.1:8000/api`.

## Comandos

```bash
npm install
npm run dev
```

La app usa el puerto `3001` para no chocar con otros frontends.

## Alcance actual

- Login con Supabase Auth.
- Verificacion de rol `admin` con `GET /api/me`.
- Gestion real de solicitudes de vendedor.
- Gestion real de categorias.
- Monitoreo de tiendas y publicaciones publicas.
- Modulos preparados para bloqueo de usuarios, advertencias y moderacion de publicaciones, pendientes de endpoints administrativos en Laravel.
