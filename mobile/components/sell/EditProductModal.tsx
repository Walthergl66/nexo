import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../theme/colors';
import type { CategoryResource, ProductForm } from '../../types/sell';
import { ProductCreateForm } from './ProductCreateForm';

type EditProductModalProps = {
  visible: boolean;
  categories: CategoryResource[];
  categoryError: string | null;
  form: ProductForm;
  existingImageUrl: string | null;
  isCategoriesLoading: boolean;
  isSaving: boolean;
  onChange: (form: ProductForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onPickImage: () => void;
  onTakeImage: () => void;
  onRefreshCategories: () => void;
};

/**
 * Edición de un producto sobre el mismo formulario de creación, en un modal.
 *
 * Antes esto vivía inline en SellScreen con estilos (`editOverlay`, `editModal`,
 * `cancelEditBtn`) y props (`submitLabel`) que nunca existieron: compilaba con
 * error y el modal se veía sin estilos. Ahora es un componente propio, con RN
 * Modal (se dibuja por encima de todo) y sus estilos colocados aquí.
 */
export function EditProductModal({
  visible,
  categories,
  categoryError,
  form,
  existingImageUrl,
  isCategoriesLoading,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
  onPickImage,
  onTakeImage,
  onRefreshCategories,
}: EditProductModalProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPhone = width < 600;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isPhone ? 'slide' : 'fade'}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, isPhone && styles.overlayPhone]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.modal,
            isPhone && styles.modalPhone,
            isPhone && { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ProductCreateForm
              categories={categories}
              categoryError={categoryError}
              form={form}
              existingImageUrl={existingImageUrl}
              isCategoriesLoading={isCategoriesLoading}
              isLoading={isSaving}
              onChange={onChange}
              onCreateProduct={onSubmit}
              onPickImage={onPickImage}
              onRefreshCategories={onRefreshCategories}
              onTakeImage={onTakeImage}
              title="Editar producto"
              subtitle="Modifica los campos que quieras actualizar (precio, stock, imagen…)."
              submitLabel="Guardar cambios"
              submitIcon="checkmark-circle"
            />
          </ScrollView>
          <Pressable
            accessibilityLabel="Cancelar edicion"
            accessibilityRole="button"
            disabled={isSaving}
            style={({ pressed }) => [
              styles.cancelBtn,
              isSaving && styles.cancelBtnDisabled,
              pressed && styles.cancelBtnPressed,
            ]}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  overlayPhone: {
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: 0,
  },
  modal: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderRadius: 22,
    padding: 10,
    overflow: 'hidden',
    shadowColor: '#0B2239',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 12,
  },
  modalPhone: {
    maxWidth: '100%',
    maxHeight: '94%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  scrollContent: {
    paddingBottom: 2,
  },
  cancelBtn: {
    marginTop: 8,
    height: 46,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cancelBtnDisabled: {
    opacity: 0.6,
  },
  cancelBtnPressed: {
    opacity: 0.7,
  },
  cancelText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
