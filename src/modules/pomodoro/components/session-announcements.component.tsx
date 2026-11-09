interface SessionAnnouncementsProps {
  // Empezar, pausar y reanudar con el tiempo restante (RF-63)
  action: string;
  // Hitos de 5 y 1 minutos y el fin (RF-64 a RF-66)
  timer: string;
}

// Regiones vivas, fuera de la vista para no repetir lo que ya se ve (RNF-02): <output> es un estado educado
// (SonarQube S6819) y el lector anuncia su texto cuando cambia, sin interrumpir. Fuera de la sesión y del resultado,
// para que el anuncio del fin no se pierda al cambiar de una vista a la otra
export function SessionAnnouncements({ action, timer }: Readonly<SessionAnnouncementsProps>) {
  return (
    <div className="sr-only">
      <output>{action}</output>
      <output>{timer}</output>
    </div>
  );
}
