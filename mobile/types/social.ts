/** Tienda pública de un usuario, tal como se ve al visitar su perfil. */
export type PublicUserStore = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
};

/**
 * Perfil público de otro usuario (búsqueda / visitar perfil). Solo lo seguro:
 * el backend nunca manda correo, teléfono, cédula ni dirección.
 */
export type PublicUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  isVerified: boolean;
  store: PublicUserStore | null;
};
