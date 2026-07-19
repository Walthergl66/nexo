import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { cartStyles as styles } from './cartStyles';

type CartEmptyStateProps = {
  isAuthenticated: boolean;
  onBackToCatalog: () => void;
};

export function CartEmptyState({ isAuthenticated, onBackToCatalog }: CartEmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Pressable
        accessibilityLabel="Volver al catalogo"
        style={[styles.backButton, { position: 'absolute', top: 16, left: 16 }]}
        onPress={onBackToCatalog}
      >
        <Ionicons name="chevron-back" size={20} color={colors.brandBlue} />
      </Pressable>

      <View style={styles.emptyIcon}>
        <Ionicons name="cart-outline" size={42} color={colors.brandBlue} />
      </View>
      <Text style={styles.emptyTitle}>{isAuthenticated ? 'Tu carrito esta vacio' : 'Inicia sesion para comprar'}</Text>
      <Text style={styles.emptyText}>
        {isAuthenticated
          ? 'Agrega productos desde el catalogo para verlos aqui.'
          : 'El catalogo es publico, pero el carrito y el checkout requieren una cuenta.'}
      </Text>
      <Pressable style={styles.primaryButton} onPress={onBackToCatalog}>
        <Text style={styles.primaryButtonText}>Explorar productos</Text>
      </Pressable>
    </View>
  );
}
