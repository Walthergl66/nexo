import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { CategoryResource, ProductForm } from '../../types/sell';
import { FormHeader, PrimaryButton } from './FormControls';
import { styles } from './sellStyles';

type ProductCreateFormProps = {
  categories: CategoryResource[];
  categoryError: string | null;
  form: ProductForm;
  isCategoriesLoading: boolean;
  isLoading: boolean;
  onChange: (form: ProductForm) => void;
  onCreateProduct: () => void;
  onPickImage: () => void;
  onRefreshCategories: () => void;
  onTakeImage: () => void;
  /** Overrides para reusar el formulario en modo edición. */
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  submitIcon?: keyof typeof Ionicons.glyphMap;
};

export function ProductCreateForm({
  categories,
  categoryError,
  form,
  isCategoriesLoading,
  isLoading,
  onChange,
  onCreateProduct,
  onPickImage,
  onRefreshCategories,
  onTakeImage,
  title = 'Nuevo producto',
  subtitle = 'Completa la informacion, agrega una imagen y elige si publicarlo ahora.',
  submitLabel,
  submitIcon,
}: ProductCreateFormProps) {
  return (
    <View style={styles.formCard}>
      <FormHeader icon="pricetag-outline" title={title} subtitle={subtitle} />
      <TextInput
        placeholder="Titulo del producto"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        value={form.name}
        onChangeText={(value) => onChange({ ...form, name: value })}
      />
      <TextInput
        multiline
        placeholder="Descripcion del producto"
        placeholderTextColor={colors.inkSoft}
        style={[styles.input, styles.textArea]}
        value={form.description}
        onChangeText={(value) => onChange({ ...form, description: value })}
      />
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Categoria</Text>
        <View style={styles.categoryOptions}>
          {isCategoriesLoading ? (
            <View style={styles.categoryLoadingRow}>
              <ActivityIndicator color={colors.brandBlue} size="small" />
              <Text style={styles.fieldHint}>Cargando categorias...</Text>
            </View>
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <Pressable
                key={category.id}
                style={({ pressed }) => [
                  styles.categoryOption,
                  form.categoryId === category.id && styles.categoryOptionActive,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => onChange({ ...form, categoryId: category.id })}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.categoryOptionText,
                    form.categoryId === category.id && styles.categoryOptionTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))
          ) : categoryError ? (
            <View style={styles.categoryErrorRow}>
              <Text style={styles.fieldHint}>{categoryError}</Text>
              <Pressable
                style={({ pressed }) => [styles.retrySmallButton, pressed && styles.buttonPressed]}
                onPress={onRefreshCategories}
              >
                <Ionicons name="refresh" size={14} color={colors.brandBlue} />
                <Text style={styles.retrySmallText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.fieldHint}>No hay categorias activas disponibles.</Text>
          )}
        </View>
      </View>
      <View style={styles.inlineRow}>
        <TextInput
          keyboardType="decimal-pad"
          placeholder="Precio"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, styles.inlineInput]}
          value={form.price}
          onChangeText={(value) => onChange({ ...form, price: value.replace(/[^0-9.,]/g, '') })}
        />
        <TextInput
          keyboardType="number-pad"
          placeholder="Cantidad"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, styles.inlineInput]}
          value={form.stock}
          onChangeText={(value) => onChange({ ...form, stock: value.replace(/\D+/g, '') })}
        />
      </View>
      <View style={styles.imagePickerPanel}>
        {form.image ? (
          <Image source={{ uri: form.image.uri }} style={styles.productImagePreview} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={28} color={colors.brandBlue} />
            <Text style={styles.fieldHint}>JPG, PNG o WebP. Maximo 5 MB.</Text>
          </View>
        )}
        <View style={styles.imageActionRow}>
          <Pressable
            style={({ pressed }) => [styles.imageActionButton, pressed && styles.buttonPressed]}
            onPress={onTakeImage}
          >
            <Ionicons name="camera-outline" size={16} color={colors.brandBlue} />
            <Text style={styles.imageActionText}>Tomar foto</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.imageActionButton, pressed && styles.buttonPressed]}
            onPress={onPickImage}
          >
            <Ionicons name="images-outline" size={16} color={colors.brandBlue} />
            <Text style={styles.imageActionText}>Subir imagen</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: form.publishNow }}
        style={({ pressed }) => [styles.toggleRow, pressed && styles.buttonPressed]}
        onPress={() => onChange({ ...form, publishNow: !form.publishNow })}
      >
        <View style={[styles.toggleBox, form.publishNow && styles.toggleBoxActive]}>
          {form.publishNow && <Ionicons name="checkmark" size={15} color={colors.surface} />}
        </View>
        <Text style={styles.toggleText}>Publicar inmediatamente</Text>
      </Pressable>
      <PrimaryButton
        disabled={isLoading}
        icon={submitIcon ?? (form.publishNow ? 'cloud-upload' : 'document-text')}
        label={submitLabel ?? (form.publishNow ? 'Publicar producto' : 'Guardar borrador')}
        loading={isLoading}
        onPress={onCreateProduct}
      />
    </View>
  );
}
