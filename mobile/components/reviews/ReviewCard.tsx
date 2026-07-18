import { StyleSheet, Text, View } from 'react-native';
import { StarRating } from './StarRating';
import { colors, radii, shadows, spacing, type as typeScale } from '../../theme/colors';
import type { ReviewResource } from '../../services/marketplaceApi';

type ReviewCardProps = {
  review: ReviewResource;
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function ReviewCard({ review }: ReviewCardProps) {
  const authorName = review.author?.display_name ?? 'Comprador verificado';
  const initials = authorName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.author} numberOfLines={1}>{authorName}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={review.rating} size={12} />
            <Text style={styles.date}>{formatDate(review.created_at)}</Text>
          </View>
        </View>
      </View>
      {review.body ? (
        <Text style={styles.body}>{review.body}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typeScale.caption,
    color: colors.brandBlue,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  author: {
    ...typeScale.subtitle,
    color: colors.ink,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    ...typeScale.micro,
    color: colors.inkSoft,
  },
  body: {
    ...typeScale.body,
    color: colors.inkMuted,
    lineHeight: 20,
  },
});
