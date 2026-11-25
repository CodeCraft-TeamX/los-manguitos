/** Hora de presentación usada por los eventos que genera la interfaz. */

export function horaActual(): string {
  const ahora = new Date();
  const horas = ahora.getHours();
  const meridiano = horas < 12 ? 'a. m.' : 'p. m.';
  const hora = String(horas % 12 || 12).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  return `${hora}:${minutos} ${meridiano}`;
}
