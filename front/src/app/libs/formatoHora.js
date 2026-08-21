export const formatoAMPM = (hora) => {
  // Dividir el string en horas, minutos y segundos
  let [horas, minutos, segundos] = hora.split(':');
  horas = parseInt(horas);
  
  // Determinar AM o PM
  let periodo = horas >= 12 ? 'PM' : 'AM';
  
  // Convertir a formato 12 horas
  horas = horas % 12 || 12; // El 0 se convierte en 12
  return `${horas}:${minutos} ${periodo}`;
}