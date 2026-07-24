import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '../common/PressableScale';
import { colors, radii } from '../../theme/colors';
import type { PublicUser } from '../../types/social';

type UserSearchResultsProps = {
  users: PublicUser[];
  isSearching: boolean;
  query: string;
  onOpenUser: (user: PublicUser) => void;
};

/**
 * Resultados de usuarios en el buscador de Inicio. Solo aparece cuando hay una
 * búsqueda con contenido: si no hay coincidencias y ya terminó de buscar, no se
 * muestra (los productos siguen abajo).
 */
export function UserSearchResults({ users, isSearching, query, onOpenUser }: UserSearchResultsProps) {
  const hasQuery = query.trim().length >= 2;

  if (!hasQuery || (users.length === 0 && !isSearching)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuarios y tiendas</Text>

      {users.length === 0 && isSearching ? (
        <View style={styles.searchingRow}>
          <ActivityIndicator size="small" color={colors.inkMuted} />
          <Text style={styles.searchingText}>Buscando usuarios…</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {users.map((user) => (
            <PressableScale
              key={user.id}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${user.displayName ?? 'usuario'}`}
              style={styles.row}
              onPress={() => onOpenUser(user)}
            >
              <UserAvatar user={user} />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.name}>
                    {user.displayName ?? 'Usuario nexo'}
                  </Text>
                  {user.isVerified && (
                    <Ionicons name="checkmark-circle" size={15} color={colors.brandBlue} />
                  )}
                </View>
                <Text numberOfLines={1} style={styles.meta}>
                  {user.store ? user.store.name : user.role === 'seller' ? 'Vendedor' : 'Comprador'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </PressableScale>
          ))}
        </View>
      )}
    </View>
  );
}

function UserAvatar({ user }: { user: PublicUser }) {
  if (user.avatarUrl) {
    return <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Ionicons name="person" size={20} color={colors.brandBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  searchingText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    flexShrink: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
