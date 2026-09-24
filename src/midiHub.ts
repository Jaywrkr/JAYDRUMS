import { requestMidiAccess, parseMidiMessage, type MidiEvent } from "./midi";

type EventListener = (evt: MidiEvent) => void;
type StateListener = () => void;

class MidiHub {
  private access: MIDIAccess | null = null;
  private currentInput: MIDIInput | null = null;
  private eventListeners = new Set<EventListener>();
  private stateListeners = new Set<StateListener>();

  async init(): Promise<void> {
    this.access = await requestMidiAccess();
    this.access.onstatechange = () => this.notifyState();
    const [firstInput] = this.inputs;
    if (firstInput) this.selectInput(firstInput.id);
    this.notifyState();
  }

  get inputs(): MIDIInput[] {
    return this.access ? Array.from(this.access.inputs.values()) : [];
  }

  get selectedInput(): MIDIInput | null {
    return this.currentInput;
  }

  selectInput(id: string): void {
    if (!this.access) return;
    if (this.currentInput) this.currentInput.onmidimessage = null;

    const input = this.access.inputs.get(id) ?? null;
    this.currentInput = input;

    if (input) {
      input.onmidimessage = (event) => {
        const parsed = parseMidiMessage(event.data, performance.now());
        for (const listener of this.eventListeners) listener(parsed);
      };
    }

    this.notifyState();
  }

  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyState(): void {
    for (const listener of this.stateListeners) listener();
  }
}

export const midiHub = new MidiHub();
