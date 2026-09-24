export type MidiEventKind = "noteon" | "noteoff" | "cc" | "other";

export interface MidiEvent {
  kind: MidiEventKind;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  channel: number;
  raw: number[];
  timestamp: number;
}

export function parseMidiMessage(data: Uint8Array | null, timestamp: number): MidiEvent {
  const raw = data ? Array.from(data) : [];
  const status = raw[0] ?? 0;
  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;

  if (command === 0x90) {
    const velocity = raw[2] ?? 0;
    return {
      kind: velocity > 0 ? "noteon" : "noteoff",
      note: raw[1],
      velocity,
      channel,
      raw,
      timestamp,
    };
  }

  if (command === 0x80) {
    return {
      kind: "noteoff",
      note: raw[1],
      velocity: raw[2] ?? 0,
      channel,
      raw,
      timestamp,
    };
  }

  if (command === 0xb0) {
    return {
      kind: "cc",
      controller: raw[1],
      value: raw[2] ?? 0,
      channel,
      raw,
      timestamp,
    };
  }

  return { kind: "other", channel, raw, timestamp };
}

export async function requestMidiAccess(): Promise<MIDIAccess> {
  if (!("requestMIDIAccess" in navigator)) {
    throw new Error(
      "Web MIDI API no disponible en este navegador. Usa Chrome o Edge sobre localhost/https.",
    );
  }
  return navigator.requestMIDIAccess({ sysex: false });
}
