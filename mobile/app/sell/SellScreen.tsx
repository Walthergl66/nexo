import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { InfoRow } from '../../components/common/InfoRow';
import { SectionTitle } from '../../components/common/SectionTitle';
import { Tag } from '../../components/common/Tag';
import {
  createProduct,
  createStore,
  fetchMyProducts,
  fetchMyStore,
  fetchProfile,
  submitSellerVerification,
  type ProfileResource,
  type StoreResource,
} from '../../services/marketplaceApi';
import { colors, radii } from '../../theme/colors';
import type { Product } from '../../types/marketplace';
import { formatPrice } from '../../utils/format';

type SellScreenProps = {
  accessToken: string | null;
  profile: ProfileResource | null;
  isProfileLoading: boolean;
  onGoToAccount: () => void;
  onProfileChange: (profile: ProfileResource | null) => void;
};

type StoreForm = {
  name: string;
  description: string;
};

type VerificationForm = {
  businessName: string;
  businessDescription: string;
  documentType: string;
  documentNumber: string;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  publishNow: boolean;
};

const initialVerificationForm: VerificationForm = {
  businessName: '',
  businessDescription: '',
  documentType: 'ruc',
  documentNumber: '',
};

const initialStoreForm: StoreForm = {
  name: '',
  description: '',
};

const initialProductForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  publishNow: false,
};

export function SellScreen({
  accessToken,
  profile,
  isProfileLoading,
  onGoToAccount,
  onProfileChange,
}: SellScreenProps) {
  const [store, setStore] = useState<StoreResource | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [verificationForm, setVerificationForm] = useState(initialVerificationForm);
  const [storeForm, setStoreForm] = useState(initialStoreForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingVerificationRequest, setHasPendingVerificationRequest] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isAuthenticated = accessToken !== null;
  const isApprovedSeller = profile?.role === 'seller' && profile.verification_status === 'approved';
  const canCreateProducts = isApprovedSeller && store?.status === 'active';

  const loadSellerState = useCallback(async () => {
    if (!accessToken || !profile) {
      setStore(null);
      setProducts([]);
      return;
    }

    if (!isApprovedSeller) {
      setStore(null);
      setProducts([]);
      return;
    }

    const [nextStore, nextProducts] = await Promise.all([
      fetchMyStore(accessToken).catch(() => null),
      fetchMyProducts(accessToken).catch(() => []),
    ]);

    setStore(nextStore);
    setProducts(nextProducts);
  }, [accessToken, isApprovedSeller, profile]);

  useEffect(() => {
    let isMounted = true;

    loadSellerState().catch(() => {
      if (isMounted) {
        setMessage('No pudimos cargar tu centro de ventas.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadSellerState]);

  const sellerStep = useMemo(() => {
    if (!isAuthenticated) {
      return 'Cuenta requerida';
    }

    if (!profile || isProfileLoading) {
      return 'Cargando cuenta';
    }

    if (profile.role === 'buyer' && profile.verification_status === 'pending' && !hasPendingVerificationRequest) {
      return 'Solicitar validacion';
    }

    if (profile.verification_status === 'pending') {
      return 'Revision pendiente';
    }

    if (profile.verification_status === 'rejected') {
      return 'Verificacion rechazada';
    }

    if (profile.verification_status === 'suspended') {
      return 'Vendedor suspendido';
    }

    if (!store) {
      return 'Crear tienda';
    }

    return 'Publicar productos';
  }, [hasPendingVerificationRequest, isAuthenticated, isProfileLoading, profile, store]);

  const handleRequestVerification = async () => {
    if (!accessToken) {
      return;
    }

    const businessName = verificationForm.businessName.trim();

    if (businessName.length < 3) {
      setMessage('Ingresa el nombre comercial de tu emprendimiento.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await submitSellerVerification(accessToken, {
        business_name: businessName,
        business_description: verificationForm.businessDescription.trim() || null,
        document_type: verificationForm.documentType.trim() || null,
        document_number: verificationForm.documentNumber.trim() || null,
      });
      const nextProfile = await fetchProfile(accessToken).catch(() => profile);
      onProfileChange(nextProfile);
      setHasPendingVerificationRequest(true);
      setVerificationForm(initialVerificationForm);
      await loadSellerState();
      setMessage('Solicitud enviada. Un administrador debe revisarla.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!accessToken) {
      return;
    }

    const name = storeForm.name.trim();

    if (name.length < 3) {
      setMessage('Ingresa un nombre de tienda valido.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const nextStore = await createStore(accessToken, {
        name,
        description: storeForm.description.trim() || null,
      });
      setStore(nextStore);
      setStoreForm(initialStoreForm);
      setMessage('Tienda creada y activa.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la tienda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!accessToken || !canCreateProducts) {
      return;
    }

    const name = productForm.name.trim();
    const price = Number(productForm.price.replace(',', '.'));
    const stock = Number(productForm.stock);

    if (name.length < 3) {
      setMessage('Ingresa un nombre de producto valido.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setMessage('Ingresa un precio mayor a cero.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setMessage('Ingresa un stock valido.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const nextProduct = await createProduct(accessToken, {
        name,
        description: productForm.description.trim() || null,
        price_cents: Math.round(price * 100),
        stock,
        status: productForm.publishNow ? 'active' : 'draft',
      });
      setProducts((current) => [nextProduct, ...current]);
      setProductForm(initialProductForm);
      setMessage(productForm.publishNow ? 'Producto publicado.' : 'Producto guardado como borrador.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el producto.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <SectionTitle title="Centro de ventas" subtitle="Ventas protegidas por verificacion." />
        <View style={styles.logicList}>
          <LogicCard
            title="Inicia sesion"
            description="Para vender necesitas una cuenta, solicitar verificacion y tener una tienda activa."
          />
          <LogicCard
            title="Catalogo publico"
            description="Puedes seguir explorando productos como visitante mientras decides registrarte."
          />
          <PrimaryButton
            disabled={false}
            icon="log-in-outline"
            label="Entrar o crear cuenta"
            loading={false}
            onPress={onGoToAccount}
          />
        </View>
      </>
    );
  }

  if (isProfileLoading || !profile) {
    return (
      <>
        <SectionTitle title="Centro de ventas" subtitle="Cargando tus opciones de venta." />
        <View style={styles.statusPanel}>
          <ActivityIndicator color={colors.brandBlue} />
          <Text style={styles.statusSubtitle}>Estamos preparando tus herramientas de venta.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <SectionTitle title="Centro de ventas" subtitle="Verificacion, tienda e inventario." />

      <View style={styles.statusPanel}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusTitle}>{sellerStep}</Text>
            <Text style={styles.statusSubtitle}>{profile?.display_name ?? profile?.email ?? 'Cuenta NEXO'}</Text>
          </View>
          <Tag text={profile?.verification_status ?? 'sync'} tone={isApprovedSeller ? 'success' : 'warning'} />
        </View>
        <InfoRow label="Rol" value={profile?.role ?? 'buyer'} />
        <InfoRow label="Tienda" value={store?.name ?? 'Sin tienda'} />
        <InfoRow label="Estado tienda" value={store?.status ?? 'No disponible'} />
      </View>

      {profile.role === 'buyer' && profile.verification_status === 'pending' && !hasPendingVerificationRequest ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Solicitud de vendedor</Text>
          <TextInput
            placeholder="Nombre comercial"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={verificationForm.businessName}
            onChangeText={(value) => setVerificationForm((current) => ({ ...current, businessName: value }))}
          />
          <TextInput
            multiline
            placeholder="Que vendes y como operas"
            placeholderTextColor={colors.inkSoft}
            style={[styles.input, styles.textArea]}
            value={verificationForm.businessDescription}
            onChangeText={(value) => setVerificationForm((current) => ({ ...current, businessDescription: value }))}
          />
          <View style={styles.inlineRow}>
            <TextInput
              autoCapitalize="none"
              placeholder="Documento"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.inlineInput]}
              value={verificationForm.documentType}
              onChangeText={(value) => setVerificationForm((current) => ({ ...current, documentType: value }))}
            />
            <TextInput
              keyboardType="number-pad"
              placeholder="Numero"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.inlineInput]}
              value={verificationForm.documentNumber}
              onChangeText={(value) => setVerificationForm((current) => ({ ...current, documentNumber: value }))}
            />
          </View>
          <PrimaryButton
            disabled={isLoading}
            icon="shield-checkmark"
            label="Enviar solicitud"
            loading={isLoading}
            onPress={handleRequestVerification}
          />
        </View>
      ) : null}

      {hasPendingVerificationRequest && (
        <LogicCard
          title="Solicitud en revision"
          description="Tu cuenta sigue como buyer hasta que un administrador apruebe la validacion de vendedor."
        />
      )}

      {profile?.verification_status === 'rejected' && (
        <>
          <LogicCard
            title="Solicitud rechazada"
            description="Puedes corregir tus datos de negocio y volver a enviar una solicitud de vendedor."
          />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva solicitud</Text>
            <TextInput
              placeholder="Nombre comercial"
              placeholderTextColor={colors.inkSoft}
              style={styles.input}
              value={verificationForm.businessName}
              onChangeText={(value) => setVerificationForm((current) => ({ ...current, businessName: value }))}
            />
            <TextInput
              multiline
              placeholder="Que cambiaste de tu solicitud anterior"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.textArea]}
              value={verificationForm.businessDescription}
              onChangeText={(value) => setVerificationForm((current) => ({ ...current, businessDescription: value }))}
            />
            <View style={styles.inlineRow}>
              <TextInput
                autoCapitalize="none"
                placeholder="Documento"
                placeholderTextColor={colors.inkSoft}
                style={[styles.input, styles.inlineInput]}
                value={verificationForm.documentType}
                onChangeText={(value) => setVerificationForm((current) => ({ ...current, documentType: value }))}
              />
              <TextInput
                keyboardType="number-pad"
                placeholder="Numero"
                placeholderTextColor={colors.inkSoft}
                style={[styles.input, styles.inlineInput]}
                value={verificationForm.documentNumber}
                onChangeText={(value) => setVerificationForm((current) => ({ ...current, documentNumber: value }))}
              />
            </View>
            <PrimaryButton
              disabled={isLoading}
              icon="shield-checkmark"
              label="Enviar nueva solicitud"
              loading={isLoading}
              onPress={handleRequestVerification}
            />
          </View>
        </>
      )}

      {profile?.verification_status === 'suspended' && (
        <LogicCard
          title="Venta pausada"
          description="Tu tienda queda fuera del catalogo publico hasta que un administrador revise la suspension."
        />
      )}

      {isApprovedSeller && !store && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Crear tienda</Text>
          <TextInput
            placeholder="Nombre de tienda"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={storeForm.name}
            onChangeText={(value) => setStoreForm((current) => ({ ...current, name: value }))}
          />
          <TextInput
            multiline
            placeholder="Descripcion corta"
            placeholderTextColor={colors.inkSoft}
            style={[styles.input, styles.textArea]}
            value={storeForm.description}
            onChangeText={(value) => setStoreForm((current) => ({ ...current, description: value }))}
          />
          <PrimaryButton disabled={isLoading} icon="storefront" label="Crear tienda" loading={isLoading} onPress={handleCreateStore} />
        </View>
      )}

      {canCreateProducts && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nuevo producto</Text>
          <TextInput
            placeholder="Nombre"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={productForm.name}
            onChangeText={(value) => setProductForm((current) => ({ ...current, name: value }))}
          />
          <TextInput
            multiline
            placeholder="Descripcion"
            placeholderTextColor={colors.inkSoft}
            style={[styles.input, styles.textArea]}
            value={productForm.description}
            onChangeText={(value) => setProductForm((current) => ({ ...current, description: value }))}
          />
          <View style={styles.inlineRow}>
            <TextInput
              keyboardType="decimal-pad"
              placeholder="Precio"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.inlineInput]}
              value={productForm.price}
              onChangeText={(value) => setProductForm((current) => ({ ...current, price: value.replace(/[^0-9.,]/g, '') }))}
            />
            <TextInput
              keyboardType="number-pad"
              placeholder="Stock"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.inlineInput]}
              value={productForm.stock}
              onChangeText={(value) => setProductForm((current) => ({ ...current, stock: value.replace(/\D+/g, '') }))}
            />
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: productForm.publishNow }}
            style={({ pressed }) => [styles.toggleRow, pressed && styles.buttonPressed]}
            onPress={() => setProductForm((current) => ({ ...current, publishNow: !current.publishNow }))}
          >
            <View style={[styles.toggleBox, productForm.publishNow && styles.toggleBoxActive]}>
              {productForm.publishNow && <Ionicons name="checkmark" size={15} color={colors.surface} />}
            </View>
            <Text style={styles.toggleText}>Publicar inmediatamente</Text>
          </Pressable>
          <PrimaryButton
            disabled={isLoading}
            icon={productForm.publishNow ? 'cloud-upload' : 'document-text'}
            label={productForm.publishNow ? 'Publicar producto' : 'Guardar borrador'}
            loading={isLoading}
            onPress={handleCreateProduct}
          />
        </View>
      )}

      {products.length > 0 && (
        <View style={styles.productList}>
          <Text style={styles.formTitle}>Tus productos</Text>
          {products.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <View style={styles.productIcon}>
                <Ionicons name={product.available ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={colors.brandBlue} />
              </View>
              <View style={styles.productInfo}>
                <Text numberOfLines={1} style={styles.productName}>{product.title}</Text>
                <Text style={styles.productMeta}>{formatPrice(product.price)} / stock {product.stock}</Text>
              </View>
              <Tag text={product.available ? 'active' : 'draft'} tone={product.available ? 'success' : 'default'} />
            </View>
          ))}
        </View>
      )}

      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );
}

type PrimaryButtonProps = {
  disabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  loading: boolean;
  onPress: () => void;
};

function PrimaryButton({ disabled, icon, label, loading, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [styles.primaryButton, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <>
          <Ionicons name={icon} size={17} color={colors.surface} />
          <Text style={styles.primaryButtonText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusPanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  statusSubtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  formTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  input: {
    minHeight: 44,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 86,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inlineInput: {
    flex: 1,
    minWidth: 120,
  },
  toggleRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  toggleBoxActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  toggleText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  productList: {
    gap: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 12,
  },
  productIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  productMeta: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  logicList: {
    gap: 12,
  },
  message: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
});
