# J-Drums

App web tipo Guitar Hero para batería electrónica (Roland TD-02). Ver `CLAUDE.md` para el contexto completo del proyecto.

## Fases implementadas

1. **Detector MIDI**: lista los dispositivos MIDI conectados y muestra en vivo cada nota, velocity y Control Change recibido. Sirve para verificar el mapa de tu kit.
2. **Calibración**: flujo guiado pieza por pieza ("Golpea el bombo", "Golpea la caja", …). Guarda la nota recibida para cada pieza en `localStorage` y permite recalibrar una pieza suelta desde la tabla del mapa actual.
3. **Práctica**: motor de juego con carriles por pieza. Las notas viajan sincronizadas al patrón elegido (definido en `src/lessons.ts`), en vertical (arriba→abajo) u horizontal (derecha→izquierda), a elección. Cuenta regresiva y metrónomo audible (Web Audio API) para no perder el tiempo. Se evalúan contra los golpes reales usando el mapa calibrado (perfecto ±30 ms, bien ±70 ms, flojo ±150 ms). Combo con multiplicador de puntaje, popups de "¡Perfecto!/Bien/Flojo/Fallo", pantalla de resultados con desglose y mejor puntaje guardado por lección (`localStorage`).

## Requisitos

- Chrome o Edge (Web MIDI API).
- Batería conectada por USB-MIDI.
- **No abrir como `file://`**: Web MIDI requiere un contexto seguro. Usar `localhost`.

## Correr en local

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto `http://localhost:5173`), conecta la batería antes o después de cargar la página y toca cada pieza para ver la nota que envía.
