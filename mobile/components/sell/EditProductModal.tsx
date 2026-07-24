import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';
import type { CategoryResource, ProductForm } from '../../types/sell';
import { ProductCreateForm } from './ProductCreateForm';

type EditProductModalProps = {
  visible: boolean;
  categories: CategoryResource[];
  categoryError: string | null;
  form: ProductForm;
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
  isCategoriesLoading,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
  onPickImage,
  onTakeImage,
  onRefreshCategories,
}: EditProductModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <ProductCreateForm
              categories={categories}
              categoryError={categoryError}
              form={form}
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
            <Pressable
              accessibilityLabel="Cancelar edicion"
              accessibilityRole="button"
              disabled={isSaving}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  modal: {
    maxHeight: '100%',
    backgroundColor: colors.background,
    borderRadius: 22,
    padding: 12,
    overflow: 'hidden',
  },
  cancelBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
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
