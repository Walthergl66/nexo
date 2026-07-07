import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { StoreForm, StoreLogoSize } from '../../types/sell';
import { FormHeader, PrimaryButton } from './FormControls';
import { styles } from './sellStyles';

type CreateStoreFormProps = {
  form: StoreForm;
  isLoading: boolean;
  onChange: (form: StoreForm) => void;
  onCreateStore: () => void;
  onPickLogo: () => void;
  onTakeLogo: () => void;
};

const logoSizeOptions: Array<{ label: string; value: StoreLogoSize }> = [
  { label: 'Pequena', value: 'small' },
  { label: 'Normal', value: 'medium' },
  { label: 'Grande', value: 'large' },
];

export function CreateStoreForm({
  form,
  isLoading,
  onChange,
  onCreateStore,
  onPickLogo,
  onTakeLogo,
}: CreateStoreFormProps) {
  return (
    <View style={styles.formCard}>
      <FormHeader
        icon="business-outline"
        title="Empecemos"
        subtitle="Ajusta la imagen y completa los datos de tu tienda."
      />
      <View style={styles.storeLogoPanel}>
        {form.logo ? (
          <Image source={{ uri: form.logo.uri }} style={styles.storeLogoPreview} />
        ) : (
          <View style={styles.storeLogoPlaceholder}>
            <Ionicons name="storefront-outline" size={26} color={colors.brandBlue} />
          </View>
        )}
        <View style={styles.storeLogoActions}>
          <Text style={styles.fieldLabel}>Foto de tienda</Text>
          <Text style={styles.fieldHint}>JPG, PNG o WebP. Maximo 5 MB.</Text>
          <View style={styles.imageActionRow}>
            <Pressable
              style={({ pressed }) => [styles.imageActionButton, pressed && styles.buttonPressed]}
              onPress={onPickLogo}
            >
              <Ionicons name="images-outline" size={16} color={colors.brandBlue} />
              <Text style={styles.imageActionText}>Subir imagen</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {form.logo && (
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Tamano de imagen</Text>
          <View style={styles.sizeOptions}>
            {logoSizeOptions.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.sizeOption,
                  form.logoSize === option.value && styles.sizeOptionActive,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => onChange({ ...form, logoSize: option.value })}
              >
                <Text style={[styles.sizeOptionText, form.logoSize === option.value && styles.sizeOptionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <TextInput
        placeholder="Nombre de tienda"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        value={form.name}
        onChangeText={(value) => onChange({ ...form, name: value })}
      />
      <TextInput
        multiline
        placeholder="Descripcion corta"
        placeholderTextColor={colors.inkSoft}
        style={[styles.input, styles.textArea]}
        value={form.description}
        onChangeText={(value) => onChange({ ...form, description: value })}
      />
      <PrimaryButton disabled={isLoading} icon="storefront" label="Crear tienda" loading={isLoading} onPress={onCreateStore} />
    </View>
  );
}
