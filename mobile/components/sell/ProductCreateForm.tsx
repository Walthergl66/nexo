import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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
  existingImageUrl?: string | null;
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

type ProductField = 'name' | 'description' | 'category' | 'price' | 'stock' | 'image';

export function ProductCreateForm({
  categories,
  categoryError,
  form,
  isCategoriesLoading,
  isLoading,
  existingImageUrl = null,
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
  const [touched, setTouched] = useState<Partial<Record<ProductField, boolean>>>({});
  const numericPrice = Number(form.price);
  const pricePreview =
    Number.isFinite(numericPrice) && numericPrice > 0
      ? `Se mostrará como ${formatPrice(numericPrice)}`
      : 'Ingresa el precio en dólares.';
  const errors = useMemo<Partial<Record<ProductField, string>>>(() => {
    const nextErrors: Partial<Record<ProductField, string>> = {};
    const numericStock = Number(form.stock);

    if (form.name.trim().length < 3) nextErrors.name = 'Escribe al menos 3 caracteres.';
    if (form.description.trim().length < 10) nextErrors.description = 'Escribe al menos 10 caracteres.';
    if (!form.categoryId) nextErrors.category = 'Selecciona una categoría.';
    if (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 9999999.99) {
      nextErrors.price = 'Ingresa un precio mayor a $0.00.';
    }
    if (form.stock === '' || !Number.isInteger(numericStock) || numericStock < 0) {
      nextErrors.stock = 'Ingresa una cantidad válida (puede ser 0).';
    }
    if (!form.image && !existingImageUrl) nextErrors.image = 'Agrega una foto para presentar el producto.';

    return nextErrors;
  }, [existingImageUrl, form.categoryId, form.description, form.image, form.name, form.stock, numericPrice]);

  useEffect(() => {
    const formWasReset =
      form.name === '' &&
      form.description === '' &&
      form.categoryId === '' &&
      form.price === '' &&
      form.stock === '' &&
      !form.image;

    if (formWasReset) setTouched({});
  }, [form.categoryId, form.description, form.image, form.name, form.price, form.stock]);

  const markTouched = (field: ProductField) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };
  const showError = (field: ProductField) => Boolean(touched[field] && errors[field]);
  const handleSubmit = () => {
    setTouched({ name: true, description: true, category: true, price: true, stock: true, image: true });
    onCreateProduct();
  };

  return (
    <View style={styles.formCard}>
      <FormHeader icon="pricetag-outline" title={title} subtitle={subtitle} />
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Título del producto</Text>
        <TextInput
          placeholder="Ej. Audífonos inalámbricos"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, showError('name') && styles.inputInvalid]}
          value={form.name}
          onChangeText={(value) => onChange({ ...form, name: value })}
          onBlur={() => markTouched('name')}
        />
        {showError('name') && <FieldError message={errors.name!} />}
      </View>
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Descripción</Text>
        <TextInput
          multiline
          placeholder="Describe características, materiales y estado."
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, styles.textArea, showError('description') && styles.inputInvalid]}
          value={form.description}
          onChangeText={(value) => onChange({ ...form, description: value })}
          onBlur={() => markTouched('description')}
        />
        {showError('description') ? (
          <FieldError message={errors.description!} />
        ) : (
          <Text style={styles.fieldHint}>Mínimo 10 caracteres.</Text>
        )}
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
                onPress={() => {
                  markTouched('category');
                  onChange({ ...form, categoryId: category.id });
                }}
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
        {showError('category') && <FieldError message={errors.category!} />}
      </View>
      <View style={styles.inlineRow}>
        <View style={[styles.fieldBlock, styles.inlineField]}>
          <Text style={styles.fieldLabel}>Precio (USD)</Text>
          <View style={[styles.priceInputWrap, showError('price') && styles.inputInvalid]}>
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
              onBlur={() => markTouched('price')}
            />
          </View>
          {showError('price') ? <FieldError message={errors.price!} /> : <Text style={styles.fieldHint}>{pricePreview}</Text>}
        </View>
        <View style={[styles.fieldBlock, styles.inlineField]}>
          <Text style={styles.fieldLabel}>Cantidad disponible</Text>
          <TextInput
            inputMode="numeric"
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.inkSoft}
            style={[styles.input, showError('stock') && styles.inputInvalid]}
            value={form.stock}
            onChangeText={(value) => onChange({ ...form, stock: value.replace(/\D+/g, '') })}
            onBlur={() => markTouched('stock')}
          />
          {showError('stock') ? (
            <FieldError message={errors.stock!} />
          ) : (
            <Text style={styles.fieldHint}>Unidades disponibles para vender.</Text>
          )}
        </View>
      </View>
      <View style={[styles.imagePickerPanel, showError('image') && styles.panelInvalid]}>
        <View style={styles.imageStatusRow}>
          <View style={styles.imageStatusCopy}>
            <Text style={styles.fieldLabel}>
              {form.image ? 'Nueva imagen seleccionada' : existingImageUrl ? 'Imagen actual' : 'Imagen del producto'}
            </Text>
            <Text style={styles.fieldHint}>
              {form.image
                ? 'Esta imagen reemplazará la actual al guardar.'
                : existingImageUrl
                  ? 'Se conservará si no seleccionas otra.'
                  : 'Selecciona una imagen clara del producto.'}
            </Text>
          </View>
          {form.image && existingImageUrl && (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.keepCurrentImageButton, pressed && styles.buttonPressed]}
              onPress={() => onChange({ ...form, image: null })}
            >
              <Ionicons name="arrow-undo-outline" size={14} color={colors.brandBlue} />
              <Text style={styles.keepCurrentImageText}>Usar actual</Text>
            </Pressable>
          )}
        </View>
        {form.image ? (
          <Image source={{ uri: form.image.uri }} style={styles.productImagePreview} />
        ) : existingImageUrl ? (
          <Image source={{ uri: existingImageUrl }} style={styles.productImagePreview} />
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
            <Text style={styles.imageActionText}>{existingImageUrl ? 'Cambiar imagen' : 'Subir imagen'}</Text>
          </Pressable>
        </View>
        {showError('image') && <FieldError message={errors.image!} />}
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
        onPress={handleSubmit}
      />
    </View>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <View style={styles.fieldErrorRow}>
      <Ionicons name="alert-circle-outline" size={14} color="#b42318" />
      <Text style={styles.fieldErrorText}>{message}</Text>
    </View>
  );
}

function normalizePriceInput(value: string): string {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const [whole = '', ...decimalParts] = normalized.split('.');
  const decimal = decimalParts.join('').slice(0, 2);

  return decimalParts.length > 0 ? `${whole}.${decimal}` : whole;
}
