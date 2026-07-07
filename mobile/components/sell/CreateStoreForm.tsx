import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { StoreForm } from '../../types/sell';
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
          <View style={styles.storeLogoPreviewFrame}>
            <Image
              source={{ uri: form.logo.uri }}
              style={[styles.storeLogoPreview, { transform: [{ scale: form.logoZoom }] }]}
            />
          </View>
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
          <Text style={styles.fieldLabel}>Recorte de imagen</Text>
          <View style={styles.cropControls}>
            <Pressable
              disabled={form.logoZoom <= 1}
              style={({ pressed }) => [
                styles.cropButton,
                form.logoZoom <= 1 && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => onChange({ ...form, logoZoom: Math.max(1, Number((form.logoZoom - 0.1).toFixed(1))) })}
            >
              <Ionicons name="remove" size={16} color={colors.brandBlue} />
            </Pressable>
            <View style={styles.cropTrack}>
              <View style={[styles.cropTrackFill, { width: `${((form.logoZoom - 1) / 1.5) * 100}%` }]} />
            </View>
            <Pressable
              disabled={form.logoZoom >= 2.5}
              style={({ pressed }) => [
                styles.cropButton,
                form.logoZoom >= 2.5 && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => onChange({ ...form, logoZoom: Math.min(2.5, Number((form.logoZoom + 0.1).toFixed(1))) })}
            >
              <Ionicons name="add" size={16} color={colors.brandBlue} />
            </Pressable>
          </View>
          <Text style={styles.fieldHint}>Acerca la imagen para recortar el logo dentro del circulo.</Text>
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
