// Utilidad para decodificar JWT y extraer el rol
export function getRoleFromToken(token: string): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    // Ajusta la clave según cómo venga el rol en tu JWT
    return decoded.rol || decoded.role || decoded.authorities?.[0] || null;
  } catch (e) {
    return null;
  }
}
