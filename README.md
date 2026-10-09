# PorkFree Scan

Android (Capacitor) barcode scanner with Open Food Facts lookup. Spanish, English, French. Results: APTO / NO APTO / NO VERIFICADO. Manual EAN entry for testing.

## Important
This is source code, **not a validated release**. The native `android/` directory must be generated using `npm install && npx cap add android`, then Android resources, signing, permissions, advertising consent, real ad IDs and icon must be configured and checked before uploading to Google Play. Never use Metal Detector's AdMob identifiers or signing alias.

Open Food Facts entries are crowdsourced and can be incomplete. Unknown ingredients must not be treated as safe.

## Estado y limitaciones
La instalación usa una versión corregida de `tar` para evitar la versión 6.2.1 bloqueada por Replit. No se ha verificado aún la instalación en Replit ni la compilación Android. El workflow genera `android/` si falta y configura la firma mediante variables de Codemagic. Deben configurarse en Codemagic el perfil `porkfree_scan` y la clave antes de compilar.

**Pendiente para publicar:** icono definitivo, integración real de AdMob y consentimiento, pruebas de escáner, revisión de permisos, clasificación de ingredientes y validación AAB. La app no debe publicarse todavía.
