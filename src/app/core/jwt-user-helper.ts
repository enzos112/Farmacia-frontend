// Utilidad para decodificar JWT y extraer el nombre de usuario
export function getUserNameFromToken(token: string): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    // El nombre de usuario está en el claim 'sub'
    return decoded.sub || null;
  } catch (e) {
    return null;
  }
}
