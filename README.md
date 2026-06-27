# Link's Fairy

<p align="center">
  <a href="https://youtu.be/pWsfGoO9NTg" target="_blank" rel="noopener">
    <img width="560" alt="Demo de Link's Fairy" src="https://img.youtube.com/vi/pWsfGoO9NTg/hqdefault.jpg" />
  </a>
</p>

<p align="center">
  <a href="https://youtu.be/pWsfGoO9NTg">Ver la demo</a>
</p>

IA colectiva para navegar con más seguridad.

Link's Fairy es un asistente de navegador que detecta páginas online arriesgadas, explica por qué en lenguaje claro y permite que el siguiente usuario se beneficie del análisis previo.

## Qué problema resolvemos

La gente puede caer en páginas convincentes pero inseguras, confusión de dominios, flujos de compra manipulativos e información engañosa.

La mayoría de usuarios necesita una señal simple antes de actuar:

- si parece segura,
- qué huele raro,
- y qué conviene hacer ahora.

Las herramientas actuales suelen ser demasiado técnicas, demasiado genéricas o demasiado lentas para una navegación normal.

## Qué hace este MVP

El MVP analiza el contexto de la página actual y devuelve:

- un resumen corto,
- razones legibles,
- una recomendación con conciencia de confianza,
- una señal tipo semáforo,
- y un bucle de feedback privado y ligero con comentarios opcionales.

## Por qué es distinto

La mayoría de herramientas analiza a cada usuario por separado.

Link's Fairy guarda un resultado de análisis compartido para una página, así que el siguiente usuario obtiene respuestas más rápidas y con menor coste sin relanzar el análisis completo cada vez.

## Flujo de usuario

1. El usuario abre una página.
2. Abre el popup de la extensión.
3. La extensión recoge un snapshot compacto de la página.
4. El backend consulta la caché.
5. Si hay miss, el backend genera el análisis y lo almacena.
6. El resultado se muestra al instante en el popup con una explicación clara.
7. El feedback privado opcional vuelve al sistema para mejorar respuestas futuras.

## Arquitectura

- **Frontend**: extensión de Chrome con Manifest V3, popup, opciones y background worker.
- **Backend**: AWS API Gateway + Lambda con SAM.
- **Storage**: DynamoDB para análisis compartidos y feedback.
- **IA**: Mistral aporta análisis estructurado y texto de traducción.

### Superficie API

- `POST /v1/lookup`: consulta la caché y genera análisis si hace falta.
- `POST /v1/report`: guarda feedback privado ligero.

## Principios de diseño

- Lenguaje claro por delante.
- Explicabilidad por encima de jerga técnica.
- Privacidad por diseño.
- Operación barata gracias a reutilizar análisis compartidos.
- Mejora colectiva frente a scoring privado aislado.

## Estructura del repositorio

- `backend/sam`: backend API, template SAM y handlers Lambda.
- `frontend/browser_extensions/chrome_extensions/linksfairy`: código de la extensión.
- `scripts`: scripts auxiliares.
- `demo`: vídeo y assets de presentación.

## Visión más allá de este MVP

Esta primera versión se centra en seguridad web y flujos de compra sospechosos. A largo plazo, la misma arquitectura puede cubrir:

- resúmenes concisos de páginas y vídeos largos,
- detección de sesgos y manipulación,
- comprobaciones de calidad argumental y desinformación,
- notas de seguridad priorizadas por la comunidad.

La visión de fondo sigue siendo la misma: un **sistema inmunitario para la mente**, empezando por una navegación más segura.

## Notas de seguridad

Esto es un asistente de seguridad en fase prototipo.
Ofrece framing de riesgo, no juicios legales.
Úsalo como apoyo a la decisión, no como verdad definitiva.

## Setup

- Configura las credenciales de AWS y Mistral en el entorno del backend.
- Despliega el backend con SAM.
- Carga la extensión en modo desarrollador de Chrome.
