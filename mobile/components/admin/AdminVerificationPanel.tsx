import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radii, shadows, spacing, type as typeScale } from '../../theme/colors';
import { useAdminVerifications } from '../../hooks/admin/useAdminVerifications';
import type { VerificationRequestResource } from '../../services/marketplaceApi';
import type { StatusTone } from '../../types/status';

type AdminVerificationPanelProps = {
  accessToken: string;
  onStatusMessage?: (message: string, tone: StatusTone) => void;
};

type ReviewTarget = {
  request: VerificationRequestResource;
  action: 'approved' | 'rejected' | 'suspended';
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  suspended: 'Suspendido',
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.popYellow,
  approved: colors.popMint,
  rejected: colors.popCoral,
  suspended: colors.inkSoft,
};

function formatDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }

  try {
    return new Date(iso).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function VerificationCard({
  item,
  isReviewing,
  onReview,
}: {
  item: VerificationRequestResource;
  isReviewing: boolean;
  onReview: (action: 'approved' | 'rejected' | 'suspended') => void;
}) {
  const isPending = item.status === 'pending';
  const isApproved = item.status === 'approved';
  const displayName = item.profile?.display_name ?? item.profile?.email ?? 'Usuario';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardAvatar}>
          <Ionicons name="person-outline" size={20} color={colors.brandBlue} />
        </View>
        <View style={styles.cardIdentity}>
          <Text style={styles.cardName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.cardEmail} numberOfLines={1}>
            {item.profile?.email ?? '—'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
      </View>

      {/* Business info */}
      <View style={styles.infoBlock}>
        <View style={styles.infoRow}>
          <Ionicons name="storefront-outline" size={13} color={colors.inkSoft} />
          <Text style={styles.infoLabel}>Negocio</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {item.business_name}
          </Text>
        </View>
        {item.business_description ? (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={13} color={colors.inkSoft} />
            <Text style={styles.infoLabel}>Descripcion</Text>
            <Text style={styles.infoValue} numberOfLines={3}>
              {item.business_description}
            </Text>
          </View>
        ) : null}
        {item.document_type || item.document_number ? (
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={13} color={colors.inkSoft} />
            <Text style={styles.infoLabel}>Documento</Text>
            <Text style={styles.infoValue}>
              {[item.document_type, item.document_number].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={13} color={colors.inkSoft} />
          <Text style={styles.infoLabel}>Enviado</Text>
          <Text style={styles.infoValue}>{formatDate(item.created_at)}</Text>
        </View>
        {item.rejection_reason ? (
          <View style={styles.rejectionRow}>
            <Ionicons name="alert-circle-outline" size={13} color={colors.popCoral} />
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      {isPending && (
        <View style={styles.actionRow}>
          <Pressable
            accessibilityLabel="Aprobar solicitud"
            accessibilityRole="button"
            disabled={isReviewing}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionApprove,
              pressed && styles.btnPressed,
              isReviewing && styles.btnDisabled,
            ]}
            onPress={() => onReview('approved')}
          >
            {isReviewing ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={15} color={colors.surface} />
                <Text style={styles.actionBtnText}>Aprobar</Text>
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityLabel="Rechazar solicitud"
            accessibilityRole="button"
            disabled={isReviewing}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionReject,
              pressed && styles.btnPressed,
              isReviewing && styles.btnDisabled,
            ]}
            onPress={() => onReview('rejected')}
          >
            <Ionicons name="close-circle-outline" size={15} color={colors.popCoral} />
            <Text style={[styles.actionBtnText, { color: colors.popCoral }]}>Rechazar</Text>
          </Pressable>
        </View>
      )}
      {isApproved && (
        <Pressable
          accessibilityLabel="Suspender vendedor"
          accessibilityRole="button"
          disabled={isReviewing}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionSuspend,
            pressed && styles.btnPressed,
            isReviewing && styles.btnDisabled,
          ]}
          onPress={() => onReview('suspended')}
        >
          {isReviewing ? (
            <ActivityIndicator size="small" color={colors.inkMuted} />
          ) : (
            <>
              <Ionicons name="pause-circle-outline" size={15} color={colors.inkMuted} />
              <Text style={[styles.actionBtnText, { color: colors.inkMuted }]}>Suspender</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

function RejectionReasonModal({
  visible,
  isLoading,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.popCoral} />
            <Text style={styles.modalTitle}>Motivo del rechazo</Text>
          </View>
          <Text style={styles.modalSubtitle}>
            Explica al vendedor por que su solicitud fue rechazada. Este mensaje sera visible.
          </Text>
          <TextInput
            autoFocus
            multiline
            editable={!isLoading}
            placeholder="Ej: La informacion del negocio esta incompleta..."
            placeholderTextColor={colors.inkSoft}
            style={styles.modalInput}
            value={reason}
            onChangeText={setReason}
          />
          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              style={({ pressed }) => [
                styles.modalBtn,
                styles.modalBtnSecondary,
                pressed && styles.btnPressed,
              ]}
              onPress={handleCancel}
            >
              <Text style={[styles.modalBtnText, { color: colors.inkMuted }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isLoading || reason.trim().length < 5}
              style={({ pressed }) => [
                styles.modalBtn,
                styles.modalBtnDanger,
                pressed && styles.btnPressed,
                (isLoading || reason.trim().length < 5) && styles.btnDisabled,
              ]}
              onPress={handleConfirm}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={[styles.modalBtnText, { color: colors.surface }]}>Confirmar rechazo</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function AdminVerificationPanel({ accessToken, onStatusMessage }: AdminVerificationPanelProps) {
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('pending');

  const {
    requests,
    isLoading,
    isReviewing,
    error,
    currentPage,
    lastPage,
    total,
    refresh,
    review,
    goToPage,
  } = useAdminVerifications({ accessToken, enabled: true });

  const handleReview = (item: VerificationRequestResource, action: 'approved' | 'rejected' | 'suspended') => {
    if (action === 'rejected') {
      setReviewTarget({ request: item, action });
      return;
    }

    executeReview(item.id, action);
  };

  const executeReview = async (requestId: string, action: 'approved' | 'rejected' | 'suspended', reason?: string) => {
    const actionLabels = {
      approved: 'Vendedor aprobado.',
      rejected: 'Solicitud rechazada.',
      suspended: 'Vendedor suspendido.',
    };

    try {
      await review(requestId, action, reason);
      onStatusMessage?.(actionLabels[action], 'success');
    } catch (err) {
      onStatusMessage?.(
        err instanceof Error ? err.message : 'No se pudo procesar la solicitud.',
        'error',
      );
    }
  };

  const handleConfirmRejection = (reason: string) => {
    if (!reviewTarget) {
      return;
    }

    const { request } = reviewTarget;
    setReviewTarget(null);
    executeReview(request.id, 'rejected', reason);
  };

  const filteredRequests = requests.filter((r) =>
    activeFilter === 'all' ? true : r.status === activeFilter,
  );

  const filters: Array<{ key: string; label: string }> = [
    { key: 'pending', label: 'Pendientes' },
    { key: 'approved', label: 'Aprobados' },
    { key: 'rejected', label: 'Rechazados' },
    { key: 'suspended', label: 'Suspendidos' },
    { key: 'all', label: 'Todos' },
  ];

  return (
    <View style={styles.container}>
      {/* Panel header */}
      <View style={styles.panelHeader}>
        <View style={styles.panelIcon}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.brandBlue} />
        </View>
        <View style={styles.panelCopy}>
          <Text style={styles.panelTitle}>Verificaciones</Text>
          <Text style={styles.panelSubtitle}>
            {total > 0 ? `${total} solicitud${total !== 1 ? 'es' : ''} en total` : 'Sin solicitudes aun'}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Actualizar lista"
          accessibilityRole="button"
          disabled={isLoading}
          style={({ pressed }) => [styles.refreshBtn, pressed && styles.btnPressed]}
          onPress={refresh}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={colors.brandBlue} />
            : <Ionicons name="refresh-outline" size={18} color={colors.brandBlue} />
          }
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => (
          <Pressable
            key={f.key}
            accessibilityRole="button"
            accessibilityState={{ selected: activeFilter === f.key }}
            style={({ pressed }) => [
              styles.filterChip,
              activeFilter === f.key && styles.filterChipActive,
              pressed && styles.btnPressed,
            ]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading && requests.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brandBlue} />
          <Text style={styles.centerStateText}>Cargando solicitudes...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.popCoral} />
          <Text style={styles.centerStateText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.retryBtn, pressed && styles.btnPressed]}
            onPress={refresh}
          >
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="checkmark-done-outline" size={32} color={colors.inkSoft} />
          <Text style={styles.centerStateText}>
            {activeFilter === 'pending'
              ? 'No hay solicitudes pendientes.'
              : 'Sin resultados para este filtro.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredRequests.map((item) => (
            <VerificationCard
              key={item.id}
              item={item}
              isReviewing={isReviewing === item.id}
              onReview={(action) => handleReview(item, action)}
            />
          ))}

          {/* Pagination */}
          {lastPage > 1 && (
            <View style={styles.pagination}>
              <Pressable
                accessibilityRole="button"
                disabled={currentPage <= 1}
                style={({ pressed }) => [
                  styles.pageBtn,
                  currentPage <= 1 && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => goToPage(currentPage - 1)}
              >
                <Ionicons name="chevron-back-outline" size={16} color={colors.brandBlue} />
              </Pressable>
              <Text style={styles.pageLabel}>
                {currentPage} / {lastPage}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={currentPage >= lastPage}
                style={({ pressed }) => [
                  styles.pageBtn,
                  currentPage >= lastPage && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => goToPage(currentPage + 1)}
              >
                <Ionicons name="chevron-forward-outline" size={16} color={colors.brandBlue} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Rejection reason modal */}
      <RejectionReasonModal
        isLoading={isReviewing === reviewTarget?.request.id}
        visible={reviewTarget !== null}
        onCancel={() => setReviewTarget(null)}
        onConfirm={handleConfirmRejection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  panelIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelCopy: {
    flex: 1,
    minWidth: 0,
  },
  panelTitle: {
    ...typeScale.heading,
    color: colors.ink,
  },
  panelSubtitle: {
    ...typeScale.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.brandBlueSoft,
    borderColor: colors.brandBlueLine,
  },
  filterChipText: {
    ...typeScale.caption,
    color: colors.inkMuted,
  },
  filterChipTextActive: {
    color: colors.brandBlue,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIdentity: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    ...typeScale.subtitle,
    color: colors.ink,
  },
  cardEmail: {
    ...typeScale.caption,
    color: colors.inkMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typeScale.micro,
  },
  infoBlock: {
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.small,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoLabel: {
    ...typeScale.caption,
    color: colors.inkSoft,
    width: 72,
    flexShrink: 0,
  },
  infoValue: {
    ...typeScale.caption,
    color: colors.ink,
    flex: 1,
    minWidth: 0,
  },
  rejectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: '#FF6B6B11',
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: '#FF6B6B33',
  },
  rejectionText: {
    ...typeScale.caption,
    color: colors.popCoral,
    flex: 1,
    minWidth: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
  },
  actionApprove: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  actionReject: {
    backgroundColor: colors.surface,
    borderColor: '#FF6B6B55',
  },
  actionSuspend: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.line,
  },
  actionBtnText: {
    ...typeScale.caption,
    color: colors.surface,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.subtle,
  },
  centerStateText: {
    ...typeScale.body,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryBtn: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    ...typeScale.caption,
    color: colors.brandBlue,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLabel: {
    ...typeScale.caption,
    color: colors.inkMuted,
  },
  btnPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  btnDisabled: {
    opacity: 0.4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 39, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    ...typeScale.heading,
    color: colors.ink,
  },
  modalSubtitle: {
    ...typeScale.body,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  modalInput: {
    minHeight: 90,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    fontSize: 13,
    fontWeight: '600',
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  modalBtnSecondary: {
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
  },
  modalBtnDanger: {
    borderColor: colors.popCoral,
    backgroundColor: colors.popCoral,
  },
  modalBtnText: {
    ...typeScale.caption,
  },
});
