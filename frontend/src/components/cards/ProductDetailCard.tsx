import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii } from '../../theme/colors';
import type { Product, ProductComment } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';
import { InfoRow } from '../common/InfoRow';
import { Tag } from '../common/Tag';

type ProductDetailCardProps = {
  product: Product;
  comments: ProductComment[];
  selectedRating: number;
  commentText: string;
  onAddToCart: () => void;
  onBack: () => void;
  onChangeCommentText: (value: string) => void;
  onChangeRating: (rating: number) => void;
  onSubmitComment: () => void;
};

export function ProductDetailCard({
  product,
  comments,
  selectedRating,
  commentText,
  onAddToCart,
  onBack,
  onChangeCommentText,
  onChangeRating,
  onSubmitComment,
}: ProductDetailCardProps) {
  const averageRating =
    comments.length > 0
      ? comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length
      : product.rating;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable accessibilityLabel="Volver al catalogo" style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={colors.brandBlue} />
        </Pressable>
        <Tag text={product.available ? 'Disponible' : 'Agotado'} tone={product.available ? 'success' : 'warning'} />
      </View>

      <View style={styles.heroVisual}>
        <Ionicons name="bag-handle" size={72} color={colors.brandBlue} />
      </View>

      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.description}>{product.description}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color={colors.surface} />
          <Text style={styles.ratingBadgeText}>{averageRating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.infoPanel}>
        <InfoRow label="Categoria" value={product.category} />
        <InfoRow label="Vendedor" value={product.seller} />
        <InfoRow label="Inventario" value={`${product.stock} unidades`} />
        <InfoRow label="Envio" value={product.shipping} />
      </View>

      <View style={styles.promiseRow}>
        <View style={styles.promisePill}>
          <Ionicons name="shield-checkmark" size={14} color={colors.brandBlue} />
          <Text style={styles.promiseText}>Compra protegida</Text>
        </View>
        <View style={styles.promisePill}>
          <Ionicons name="cube" size={14} color={colors.brandBlue} />
          <Text style={styles.promiseText}>Stock confirmado</Text>
        </View>
      </View>

      <Pressable
        disabled={!product.available}
        style={({ pressed }) => [
          styles.addCartButton,
          !product.available && styles.addCartButtonDisabled,
          pressed && styles.addCartButtonPressed,
        ]}
        onPress={onAddToCart}
      >
        <Ionicons name="cart" size={18} color={colors.surface} />
        <Text style={styles.addCartText}>Agregar a carrito</Text>
      </Pressable>

      <View style={styles.reviewBox}>
        <Text style={styles.sectionTitle}>Calificar producto</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} accessibilityLabel={`${star} estrellas`} onPress={() => onChangeRating(star)}>
              <Ionicons
                name={star <= selectedRating ? 'star' : 'star-outline'}
                size={26}
                color={colors.brandBlue}
              />
            </Pressable>
          ))}
        </View>
        <TextInput
          multiline
          placeholder="Escribe un comentario sobre tu experiencia"
          placeholderTextColor={colors.inkSoft}
          style={styles.commentInput}
          value={commentText}
          onChangeText={onChangeCommentText}
        />
        <Pressable style={({ pressed }) => [styles.commentButton, pressed && styles.commentButtonPressed]} onPress={onSubmitComment}>
          <Text style={styles.commentButtonText}>Publicar comentario</Text>
        </Pressable>
      </View>

      <View style={styles.commentsList}>
        <Text style={styles.sectionTitle}>Comentarios</Text>
        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentRating}>{comment.rating}/5</Text>
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },
  heroVisual: {
    height: 150,
    borderRadius: radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
  },
  description: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: colors.brandBlue,
    fontSize: 28,
    fontWeight: '900',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandBlue,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ratingBadgeText: {
    color: colors.surface,
    fontWeight: '900',
  },
  infoPanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    padding: 14,
    gap: 10,
  },
  promiseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  promisePill: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.silverSoft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
  },
  promiseText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
  },
  addCartButton: {
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addCartButtonDisabled: {
    backgroundColor: colors.inkSoft,
  },
  addCartButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  addCartText: {
    color: colors.surface,
    fontWeight: '900',
  },
  reviewBox: {
    backgroundColor: colors.brandBlueSoft,
    borderRadius: radii.medium,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
  },
  commentInput: {
    minHeight: 78,
    borderRadius: radii.medium,
    padding: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  commentButton: {
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlue,
  },
  commentButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  commentButtonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  commentsList: {
    gap: 10,
  },
  commentItem: {
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  commentAuthor: {
    color: colors.ink,
    fontWeight: '900',
  },
  commentRating: {
    color: colors.brandBlue,
    fontSize: 12,
  },
  commentText: {
    color: colors.inkMuted,
    lineHeight: 19,
  },
});
