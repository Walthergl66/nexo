# nexo mobile

La app Expo activa vive en esta carpeta.

Antes de tocar integraciones Expo, revisar la documentacion versionada correspondiente al SDK declarado en `package.json`.

La app debe consumir el backend Laravel mediante `EXPO_PUBLIC_API_BASE_URL`.

La autenticacion mobile usa Supabase Auth con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`; las rutas protegidas envian el JWT de la sesion activa al backend Laravel.
