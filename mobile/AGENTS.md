# nexo mobile

La app Expo activa vive en esta carpeta.

Antes de tocar integraciones Expo, revisar la documentacion versionada correspondiente al SDK declarado en `package.json`.

La app debe consumir el backend Laravel mediante `EXPO_PUBLIC_API_BASE_URL`.

Las rutas protegidas usan temporalmente `EXPO_PUBLIC_SUPABASE_ACCESS_TOKEN` para desarrollo manual hasta integrar el flujo completo de Supabase Auth en la app.
