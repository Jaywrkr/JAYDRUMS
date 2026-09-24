# J-Drums

App web tipo Guitar Hero para batería electrónica (Roland TD-02). Ver `CLAUDE.md` para el contexto completo del proyecto.

## Fases implementadas

1. **Detector MIDI**: lista los dispositivos MIDI conectados y muestra en vivo cada nota, velocity y Control Change recibido. Sirve para verificar el mapa de tu kit.
2. **Calibración**: flujo guiado pieza por pieza ("Golpea el bombo", "Golpea la caja", …). Guarda la nota recibida para cada pieza en `localStorage` y permite recalibrar una pieza suelta desde la tabla del mapa actual.

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
