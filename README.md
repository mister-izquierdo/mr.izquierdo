# Mr_Izquierdo Landing · V17 SEO técnica

Basada directamente en V16.4. Esta versión añade únicamente mejoras SEO/técnicas no visuales.

## Cambios V17
- Metadatos de aplicación y referrer.
- Twitter image alt.
- JSON-LD ampliado con `WebPage`, catálogo de servicios y contexto semántico más preciso.
- Se conserva `ProfessionalService`, `Person` y FAQ visible.
- `config.js` conserva la URL funcional de Apps Script desplegada para el formulario.
- `sitemap.xml` actualizado a 2026-10-05.
- No se modificaron `styles.css` ni la estructura visual/interactiva de la landing.

## Importante
Antes de publicar, comprueba el dominio en Google Search Console y solicita la indexación de la URL principal.


## V18 · Analítica gratuita opcional
- Integración preparada para Microsoft Clarity, sin coste.
- La carga de Clarity se produce únicamente después de aceptar la analítica.
- El consentimiento se comunica mediante Clarity Consent Mode V2.
- Los eventos clave existentes de la landing se envían también a Clarity cuando está activado.
- No se ha modificado `assets/styles.css` ni la estructura visual de la landing.
- Para activarlo: crea un proyecto en Microsoft Clarity y pega su Project ID en `assets/config.js` → `CLARITY_ID`.
