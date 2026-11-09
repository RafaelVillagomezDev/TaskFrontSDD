// BroadcastChannel simulado para los tests de la sesión entre pestañas (spec 004 RF-04 a RF-07): guarda lo que se
// envía y permite entregar un mensaje como si viniera de otra pestaña
export class FakeBroadcastChannel extends EventTarget {
  static instances: FakeBroadcastChannel[] = [];
  static posted: { name: string; message: unknown }[] = [];

  readonly name: string;
  closed = false;

  constructor(name: string) {
    super();
    this.name = name;
    FakeBroadcastChannel.instances.push(this);
  }

  postMessage(message: unknown): void {
    FakeBroadcastChannel.posted.push({ name: this.name, message });
  }

  close(): void {
    this.closed = true;
  }

  // Mensaje de otra pestaña: BroadcastChannel no entrega a quien envía, así que llega por aquí
  receive(data: unknown): void {
    this.dispatchEvent(new MessageEvent('message', { data }));
  }
}

const original = Object.getOwnPropertyDescriptor(globalThis, 'BroadcastChannel');

function define(value: unknown): void {
  Object.defineProperty(globalThis, 'BroadcastChannel', { value, configurable: true, writable: true });
}

export function installFakeBroadcastChannel(): void {
  FakeBroadcastChannel.instances = [];
  FakeBroadcastChannel.posted = [];
  define(FakeBroadcastChannel);
}

// Navegador sin BroadcastChannel (RF-07)
export function removeBroadcastChannel(): void {
  define(undefined);
}

export function restoreBroadcastChannel(): void {
  if (original === undefined) {
    define(undefined);
    return;
  }
  Object.defineProperty(globalThis, 'BroadcastChannel', original);
}
