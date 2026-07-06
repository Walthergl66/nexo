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
import { colors, radii, shadows } from '../../theme/colors';
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
  const activeProducts = products.filter((product) => product.available).length;
  const draftProducts = Math.max(0, products.length - activeProducts);

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
          <View style={styles.statusIdentity}>
            <View style={styles.statusIcon}>
              <Ionicons name="storefront-outline" size={23} color={colors.brandBlue} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>{sellerStep}</Text>
              <Text style={styles.statusSubtitle}>{profile?.display_name ?? profile?.email ?? 'Cuenta NEXO'}</Text>
            </View>
          </View>
          <Tag text={profile?.verification_status ?? 'sync'} tone={isApprovedSeller ? 'success' : 'warning'} />
        </View>

        <View style={styles.sellerProgress}>
          <StepPill label="Cuenta" active done />
          <StepPill label="Validacion" active={isApprovedSeller || profile.verification_status === 'pending'} done={isApprovedSeller} />
          <StepPill label="Tienda" active={Boolean(store)} done={store?.status === 'active'} />
          <StepPill label="Catalogo" active={products.length > 0} done={activeProducts > 0} />
        </View>

        <View style={styles.metricsGrid}>
          <MiniMetric label="Productos" value={String(products.length)} />
          <MiniMetric label="Activos" value={String(activeProducts)} />
          <MiniMetric label="Borradores" value={String(draftProducts)} />
        </View>

        <View style={styles.infoGroup}>
          <InfoRow label="Rol" value={profile?.role ?? 'buyer'} />
          <InfoRow label="Tienda" value={store?.name ?? 'Sin tienda'} />
          <InfoRow label="Estado tienda" value={store?.status ?? 'No disponible'} />
        </View>
      </View>

      {message && (
        <View style={styles.messagePanel}>
          <Ionicons name="information-circle-outline" size={17} color={colors.brandBlue} />
          <Text style={styles.message}>{message}</Text>
        </View>
      )}

      {profile.role === 'buyer' && profile.verification_status === 'pending' && !hasPendingVerificationRequest ? (
        <View style={styles.formCard}>
          <FormHeader
            icon="shield-checkmark-outline"
            title="Solicitud de vendedor"
            subtitle="Datos basicos para que el equipo valide tu emprendimiento."
          />
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
            <FormHeader
              icon="refresh-circle-outline"
              title="Nueva solicitud"
              subtitle="Actualiza la informacion para una nueva revision."
            />
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
          <FormHeader
            icon="business-outline"
            title="Crear tienda"
            subtitle="Tu tienda quedara activa al crearla porque ya estas aprobado."
          />
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
          <FormHeader
            icon="pricetag-outline"
            title="Nuevo producto"
            subtitle="Publica de inmediato o guarda como borrador para terminarlo despues."
          />
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
          <View style={styles.productListHeader}>
            <Text style={styles.formTitle}>Tus productos</Text>
            <Tag text={`${products.length} items`} tone="default" />
          </View>
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

type StepPillProps = {
  label: string;
  active: boolean;
  done: boolean;
};

function StepPill({ label, active, done }: StepPillProps) {
  return (
    <View style={[styles.stepPill, active && styles.stepPillActive]}>
      <View style={[styles.stepDot, done && styles.stepDotDone]}>
        {done && <Ionicons name="checkmark" size={11} color={colors.surface} />}
      </View>
      <Text numberOfLines={1} style={[styles.stepLabel, active && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

type MiniMetricProps = {
  label: string;
  value: string;
};

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <View style={styles.miniMetric}>
      <Text style={styles.miniMetricValue}>{value}</Text>
      <Text style={styles.miniMetricLabel}>{label}</Text>
    </View>
  );
}

type FormHeaderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

function FormHeader({ icon, title, subtitle }: FormHeaderProps) {
  return (
    <View style={styles.formHeader}>
      <View style={styles.formIcon}>
        <Ionicons name={icon} size={18} color={colors.brandBlue} />
      </View>
      <View style={styles.formHeaderCopy}>
        <Text style={styles.formTitle}>{title}</Text>
        <Text style={styles.formSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

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
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
    ...shadows.card,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  sellerProgress: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepPill: {
    minHeight: 34,
    flexGrow: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
  },
  stepPillActive: {
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  stepLabel: {
    flex: 1,
    minWidth: 0,
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.ink,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  miniMetric: {
    flex: 1,
    minHeight: 66,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  miniMetricValue: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '700',
  },
  miniMetricLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  infoGroup: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 11,
    ...shadows.card,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 2,
  },
  formIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  formTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  formSubtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
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
    fontWeight: '600',
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
    fontWeight: '700',
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
  productListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    ...shadows.card,
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
    fontWeight: '700',
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
  messagePanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.brandBlueLine,
    backgroundColor: colors.brandBlueSoft,
    padding: 12,
  },
  message: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
    minWidth: 0,
  },
});
