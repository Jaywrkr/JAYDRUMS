# J-Drums — Contexto del proyecto

## Objetivo
App web tipo Guitar Hero para batería electrónica. Las notas bajan por pantalla y el usuario las toca en su batería real; la app detecta cada golpe por MIDI y lo evalúa (a tiempo, temprano, tarde, fallo).

Dos modos:
1. **Lecciones**: ejercicios progresivos para aprender técnica y estilos (de básico a avanzado).
2. **Canciones / grooves**: tocar sobre patrones completos cargados desde archivos MIDI.

El usuario ya sabe tocar bastante; las lecciones deben llegar a nivel avanzado y cubrir varios estilos.

## Hardware
- Batería: **Roland TD-02** (conexión USB-MIDI a PC Windows, ya probada con Audacity).
- Piezas: bombo (kick), caja (snare), 3 toms, hi-hat con pedal, crash, ride.

## Mapa MIDI por defecto del TD-02 (referencia oficial Roland)
| Pieza | Nota |
|---|---|
| Kick | 36 |
| Snare (parche) | 38 |
| Snare (aro) | 40 |
| Snare (cross-stick) | 37 |
| Tom 1 | 48 |
| Tom 2 | 45 |
| Tom 3 | 43 |
| Hi-hat abierto (bow) | 46 |
| Hi-hat abierto (edge) | 26 |
| Hi-hat cerrado | 42 (verificar) |
| Hi-hat pedal | 44 (verificar) |
| Crash | 49 (verificar) |
| Ride | 51 (verificar) |

Fuente: artículo de soporte Roland "TD-02K, TD-02KV: Default MIDI Note Map". Los marcados "verificar" siguen el estándar Roland/GM pero no se confirmaron para este modelo.

- **Pedal del hi-hat**: además de nota, envía **Control Change 4** (0–127) con el nivel de apertura. Capturarlo para saber si se tocó abierto o cerrado.
- Leer también **velocity** (fuerza del golpe) para ejercicios de dinámica y acentos.

## Decisión clave: calibración interactiva
No depender del mapa fijo. La app tiene una pantalla de calibración:
- Dice "Golpea el bombo", el usuario golpea, se guarda el número de nota recibido.
- Repite para cada pieza (incluyendo variantes: aro, cross-stick, hi-hat abierto/cerrado/pedal).
- Guarda el mapa en `localStorage`.
- Permite recalibrar una pieza suelta.
- El mapa por defecto de arriba se usa como valor inicial.

## Stack y ejecución
- **Frontend puro**, sin backend. Web MIDI API (Chrome / Edge).
- Vanilla JS o TypeScript con **Vite** (simple, sin framework pesado salvo que haga falta).
- **Corre local**: Web MIDI requiere contexto seguro; `localhost` funciona. Usar `npm run dev` (Vite) o un servidor local. No abrir como `file://`.
- Deploy opcional a futuro: GitHub Pages o Cloudflare Pages (gratis). Vercel no, por límite de deploys.
- Flujo del usuario: desarrolla en la nube (Claude Code conectado al repo de GitHub) y luego descarga el repo para correrlo local en Windows.

## Fuentes de contenido para lecciones
- **Archivos MIDI de batería** (formato principal). Cada nota MIDI = pieza + tiempo + velocity.
- **Groove MIDI Dataset (Google Magenta)**: horas de batería tocada por humanos, en MIDI, con licencia abierta. Útil para grooves reales por estilo (rock, funk, jazz, latin, etc.). Revisar la licencia exacta antes de incluir archivos en el repo.
- **MusicXML** como formato secundario para partituras escritas.
- Lecciones propias definidas en JSON (patrones, BPM, compases) para rudimentos y ejercicios técnicos.
- **Spotify descartado**: su API no permite sincronizar audio con notas. Nada de canciones con copyright.

## Plan de fases
1. **Detector MIDI**: página que lista dispositivos y muestra en vivo nota, velocity y CC recibidos. Sirve para verificar el mapa.
2. **Calibración**: flujo guiado pieza por pieza, guardado en `localStorage`.
3. **Motor de juego**: carriles por pieza, notas que bajan sincronizadas al reloj (`performance.now()` / `AudioContext.currentTime`), ventana de tolerancia (ej. perfecto ±30 ms, bien ±70 ms), puntuación, racha, precisión.
4. **Compensación de latencia**: calibración de offset (tocar al ritmo de un metrónomo y medir el desfase promedio).
5. **Metrónomo** y control de BPM (practicar lento y subir).
6. **Cargador de MIDI**: importar archivos `.mid`, mapear notas General MIDI al kit calibrado.
7. **Currículo de lecciones**: niveles progresivos —
   - Fundamentos: pulso, negras/corcheas/semicorcheas, coordinación bombo-caja-hi-hat.
   - Rudimentos: single/double stroke, paradiddles, flams, drags.
   - Grooves por estilo: rock, pop, funk, shuffle, jazz, bossa, reggae, latin, metal (doble bombo).
   - Fills y transiciones por los toms.
   - Dinámica (acentos, ghost notes vía velocity), hi-hat abierto/cerrado, independencia.
   - Tresillos, polirritmos, métricas impares.
8. **Progreso**: historial de sesiones, precisión por lección, desbloqueo de niveles (guardado local).

## Preferencias del usuario
- Llamarlo **Jay**.
- Respuestas directas, prácticas, sin rodeos. Aprendizaje aplicado.
- Avanzar por fases, probando cada una con la batería real antes de seguir.

## Primer paso
Construir la **fase 1 (detector MIDI)** y dejar la estructura del proyecto lista con Vite.
