import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { CategoryResource, ProductForm } from '../../types/sell';
import { formatPrice } from '../../utils/format';
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
  const numericPrice = Number(form.price);
  const pricePreview =
    Number.isFinite(numericPrice) && numericPrice > 0
      ? `Se mostrará como ${formatPrice(numericPrice)}`
      : 'Ingresa el precio en dólares.';

  return (
    <View style={styles.formCard}>
      <FormHeader icon="pricetag-outline" title={title} subtitle={subtitle} />
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Título del producto</Text>
        <TextInput
          placeholder="Ej. Audífonos inalámbricos"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          value={form.name}
          onChangeText={(value) => onChange({ ...form, name: value })}
        />
      </View>
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Descripción</Text>
        <TextInput
          multiline
          placeholder="Describe características, materiales y estado."
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(value) => onChange({ ...form, description: value })}
        />
        <Text style={styles.fieldHint}>Mínimo 10 caracteres.</Text>
      </View>
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Categoría</Text>
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
        <View style={[styles.fieldBlock, styles.inlineField]}>
          <Text style={styles.fieldLabel}>Precio (USD)</Text>
          <View style={styles.priceInputWrap}>
            <Text style={styles.pricePrefix}>$</Text>
            <TextInput
              accessibilityLabel="Precio en dólares"
              inputMode="decimal"
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.inkSoft}
              style={styles.priceInput}
              value={form.price}
              onChangeText={(value) => onChange({ ...form, price: normalizePriceInput(value) })}
            />
          </View>
          <Text style={styles.fieldHint}>{pricePreview}</Text>
        </View>
        <View style={[styles.fieldBlock, styles.inlineField]}>
          <Text style={styles.fieldLabel}>Cantidad disponible</Text>
          <TextInput
            inputMode="numeric"
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={form.stock}
            onChangeText={(value) => onChange({ ...form, stock: value.replace(/\D+/g, '') })}
          />
          <Text style={styles.fieldHint}>Unidades disponibles para vender.</Text>
        </View>
      </View>
      <View style={styles.imagePickerPanel}>
        {form.image ? (
          <Image source={{ uri: form.image.uri }} style={styles.productImagePreview} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Seleccionar imagen del producto"
            accessibilityHint="Abre la galeria para elegir una imagen"
            style={({ pressed }) => [styles.productImagePlaceholder, pressed && styles.imagePlaceholderPressed]}
            onPress={onPickImage}
          >
            <Ionicons name="image-outline" size={28} color={colors.brandBlue} />
            <Text style={styles.fieldHint}>JPG, PNG o WebP. Maximo 5 MB.</Text>
          </Pressable>
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

function normalizePriceInput(value: string): string {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const [whole = '', ...decimalParts] = normalized.split('.');
  const decimal = decimalParts.join('').slice(0, 2);

  return decimalParts.length > 0 ? `${whole}.${decimal}` : whole;
}
