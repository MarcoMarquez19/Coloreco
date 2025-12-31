# Voces disponibles (Lista detectada)

Este archivo lista las voces disponibles que detectaste en tu navegador (Chrome). La app también incluye funciones para elegir una voz preferida automáticamente o manualmente.

| Índice | Nombre | Lang | Local | Default |
|---:|---|---:|:---:|:---:|
| 0 | Microsoft Raul - Spanish (Mexico) | es-MX | true | true |
| 1 | Microsoft Laura - Spanish (Spain) | es-ES | true | false |
| 2 | Microsoft Pablo - Spanish (Spain) | es-ES | true | false |
| 3 | Microsoft Helena - Spanish (Spain) | es-ES | true | false |
| 4 | Microsoft Sabina - Spanish (Mexico) | es-MX | true | false |
| 5 | Google Deutsch | de-DE | false | false |
| 6 | Google US English | en-US | false | false |
| 7 | Google UK English Female | en-GB | false | false |
| 8 | Google UK English Male | en-GB | false | false |
| 9 | Google español | es-ES | false | false |
| 10 | Google español de Estados Unidos | es-US | false | false |
| 11 | Google français | fr-FR | false | false |
| 12 | Google हिन्दी | hi-IN | false | false |
| 13 | Google Bahasa Indonesia | id-ID | false | false |
| 14 | Google italiano | it-IT | false | false |
| 15 | Google 日本語 | ja-JP | false | false |
| 16 | Google 한국의 | ko-KR | false | false |
| 17 | Google Nederlands | nl-NL | false | false |
| 18 | Google polski | pl-PL | false | false |
| 19 | Google português do Brasil | pt-BR | false | false |
| 20 | Google русский | ru-RU | false | false |
| 21 | Google 普通话（中国大陆） | zh-CN | false | false |
| 22 | Google 粤語（香港） | zh-HK | false | false |
| 23 | Google 國語（臺灣） | zh-TW | false | false |

---

## Cómo verificar y cambiar la voz (consola)

En la consola del navegador (DevTools) puedes listar voces y seleccionar 'Sabina' o cualquier otra:

- Listar voces:  
```js
(window.speechSynthesis.getVoices() || []).map((v, i) => ({ i, name: v.name, lang: v.lang, local: v.localService, default: v.default }))
```

- Seleccionar Sabina por nombre (usa la API del servicio dentro de la app):  
```js
import('$lib/audio/tts.service').then(({ ttsService }) => ttsService.setVoiceByName('Sabina'))
```

- Seleccionar por índice (por ejemplo índice 4):
```js
import('$lib/audio/tts.service').then(({ ttsService }) => ttsService.setVoiceByIndex(4))
```

La selección se guarda en `localStorage` bajo la clave `coloreco_tts_preferred_voice`.

---

## Cambios de limpieza realizados en el código

- Se eliminaron mensajes de `console.info`/`console.warn` innecesarios del servicio TTS para evitar ruido en consola.
- Se eliminó la función `getSpanishVoices()` porque no se usaba en el proyecto.
- Se evitó la eliminación de callbacks al detener la narración: ahora las suscripciones a `onWord`/`onEnd` persisten aunque se llame a `stop()`.

Si quieres, puedo añadir un pequeño indicador en la UI (Ajustes) que muestre la voz actualmente seleccionada, o un botón para forzar "Usar Sabina" en la página de `Ajustes`.
