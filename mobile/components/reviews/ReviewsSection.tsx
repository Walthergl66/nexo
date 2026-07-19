import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ReviewCard } from './ReviewCard';
import { StarRating } from './StarRating';
import {
  createReview,
  fetchProductReviews,
  type ReviewResource,
} from '../../services/marketplaceApi';
import { colors, radii, shadows, spacing, type as typeScale } from '../../theme/colors';
import type { StatusTone } from '../../types/status';

type ReviewsSectionProps = {
  productSlug: string;
  averageRating: number;
  reviewCount: number;
  isAuthenticated: boolean;
  isOwn: boolean;
  accessToken: string | null;
  onStatusMessage?: (message: string, tone: StatusTone) => void;
};

export function ReviewsSection({
  productSlug,
  averageRating,
  reviewCount,
  isAuthenticated,
  isOwn,
  accessToken,
  onStatusMessage,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const [draftBody, setDraftBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const data = await fetchProductReviews(productSlug, page);
      setReviews(data.data);
      setLastPage(data.meta.last_page);
      setCurrentPage(page);
    } catch {
      // silencioso — no bloqueante
    } finally {
      setIsLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    void loadReviews(1);
  }, [loadReviews]);

  const handleSubmitReview = async () => {
    if (!accessToken || draftRating === 0) return;
    setIsSubmitting(true);
    try {
      const newReview = await createReview(accessToken, productSlug, {
        rating: draftRating,
        body: draftBody.trim() || null,
      });
      setReviews((prev) => [newReview, ...prev]);
      setShowModal(false);
      setDraftRating(0);
      setDraftBody('');
      onStatusMessage?.('Reseña publicada.', 'success');
    } catch (err) {
      onStatusMessage?.(
        err instanceof Error ? err.message : 'No se pudo publicar la reseña.',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabecera de agregados */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryLeft}>
          <Text style={styles.sectionTitle}>Reseñas</Text>
          {reviewCount > 0 && (
            <View style={styles.ratingBadge}>
              <StarRating rating={averageRating} size={13} />
              <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({reviewCount})</Text>
            </View>
          )}
        </View>
        {isAuthenticated && !isOwn && (
          <Pressable
            accessibilityLabel="Escribir reseña"
            accessibilityRole="button"
            style={({ pressed }) => [styles.writeBtn, pressed && styles.btnPressed]}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="create-outline" size={14} color={colors.brandBlue} />
            <Text style={styles.writeBtnText}>Escribir reseña</Text>
          </Pressable>
        )}
      </View>

      {/* Lista */}
      {isLoading && reviews.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandBlue} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={28} color={colors.inkSoft} />
          <Text style={styles.emptyText}>Aun no hay reseñas para este producto.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}

          {lastPage > 1 && (
            <View style={styles.pagination}>
              <Pressable
                disabled={currentPage <= 1}
                style={({ pressed }) => [
                  styles.pageBtn,
                  currentPage <= 1 && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => void loadReviews(currentPage - 1)}
              >
                <Ionicons name="chevron-back-outline" size={16} color={colors.brandBlue} />
              </Pressable>
              <Text style={styles.pageLabel}>{currentPage} / {lastPage}</Text>
              <Pressable
                disabled={currentPage >= lastPage}
                style={({ pressed }) => [
                  styles.pageBtn,
                  currentPage >= lastPage && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => void loadReviews(currentPage + 1)}
              >
                <Ionicons name="chevron-forward-outline" size={16} color={colors.brandBlue} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Modal de escritura */}
      <Modal
        animationType="slide"
        transparent
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tu reseña</Text>
              <Pressable
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
                style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Calificacion</Text>
            <StarRating
              rating={draftRating}
              size={32}
              interactive
              onRate={setDraftRating}
            />

            <Text style={styles.modalLabel}>Comentario (opcional)</Text>
            <TextInput
              multiline
              editable={!isSubmitting}
              maxLength={1000}
              placeholder="Cuéntanos tu experiencia con este producto..."
              placeholderTextColor={colors.inkSoft}
              style={styles.modalInput}
              value={draftBody}
              onChangeText={setDraftBody}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting || draftRating === 0}
              style={({ pressed }) => [
                styles.submitBtn,
                (isSubmitting || draftRating === 0) && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              onPress={handleSubmitReview}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.surface} />
                  <Text style={styles.submitBtnText}>Publicar reseña</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLeft: { gap: spacing.xs },
  sectionTitle: { ...typeScale.heading, color: colors.ink },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingNumber: { ...typeScale.subtitle, color: colors.ink },
  ratingCount: { ...typeScale.caption, color: colors.inkMuted },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
  },
  writeBtnText: { ...typeScale.caption, color: colors.brandBlue },
  list: { gap: spacing.sm },
  centered: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: { ...typeScale.body, color: colors.inkMuted, textAlign: 'center' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLabel: { ...typeScale.caption, color: colors.inkMuted },
  btnPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  btnDisabled: { opacity: 0.4 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,21,39,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.large,
    borderTopRightRadius: radii.large,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { ...typeScale.heading, color: colors.ink },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLabel: { ...typeScale.caption, color: colors.inkMuted },
  modalInput: {
    minHeight: 100,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    fontSize: 13,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitBtnText: { ...typeScale.subtitle, color: colors.surface },
});
