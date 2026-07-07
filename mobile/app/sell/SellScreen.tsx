import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { SectionTitle } from '../../components/common/SectionTitle';
import { CreateStoreForm } from '../../components/sell/CreateStoreForm';
import { ProductCreateForm } from '../../components/sell/ProductCreateForm';
import { ProductSuccessDialog } from '../../components/sell/ProductSuccessDialog';
import { SellerProductList } from '../../components/sell/SellerProductList';
import {
  createProduct,
  createStore,
  fetchProfile,
  submitSellerVerification,
} from '../../services/marketplaceApi';
import {
  pickProductImage,
  takeProductImage,
  uploadProductImage,
} from '../../services/productImageService';
import {
  pickStoreLogo,
  takeStoreLogo,
  uploadStoreLogo,
} from '../../services/storeLogoService';
import { colors } from '../../theme/colors';
import { FormHeader, PrimaryButton } from '../../components/sell/FormControls';
import { styles } from '../../components/sell/sellStyles';
import {
  initialProductForm,
  initialStoreForm,
  initialVerificationForm,
} from '../../constants/sell';
import { useSellCategories } from '../../hooks/sell/useSellCategories';
import { useSellerCenter } from '../../hooks/sell/useSellerCenter';
import type { SellScreenProps } from '../../types/sell';

export function SellScreen({
  accessToken,
  profile,
  isProfileLoading,
  onExploreProducts,
  onGoToAccount,
  onProfileChange,
}: SellScreenProps) {
  const [verificationForm, setVerificationForm] = useState(initialVerificationForm);
  const [storeForm, setStoreForm] = useState(initialStoreForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productSuccess, setProductSuccess] = useState<{
    description: string;
    title: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const handleSellerLoaded = useCallback(() => setMessage(null), []);
  const handleSellerError = useCallback((nextMessage: string) => setMessage(nextMessage), []);
  const {
    categories,
    categoryError,
    isCategoriesLoading,
    refreshCategories,
  } = useSellCategories();
  const {
    hasPendingVerificationRequest,
    isLoading: isSellerLoading,
    loadSellerState,
    products,
    saveSellerState,
    sellerState,
    setHasPendingVerificationRequest,
    setProducts,
    setSellerState,
    setStore,
    store,
  } = useSellerCenter({
    accessToken,
    profile,
    onError: handleSellerError,
    onLoaded: handleSellerLoaded,
    onProfileChange,
  });
  const isAuthenticated = accessToken !== null;
  const isApprovedSeller = profile?.role === 'seller' && profile.verification_status === 'approved';
  const canCreateProducts = isApprovedSeller && store?.status === 'active';
  const resetProductForm = useCallback(() => {
    setProductForm({ ...initialProductForm, image: null });
  }, []);

  const sellerStep = useMemo(() => {
    if (!isAuthenticated) {
      return 'Cuenta requerida';
    }

    if (!profile || isProfileLoading) {
      return 'Cargando cuenta';
    }

    switch (sellerState) {
      case 'verification_pending':
        return 'Revision pendiente';
      case 'verification_rejected':
        return 'Verificacion rechazada';
      case 'seller_suspended':
        return 'Vendedor suspendido';
      case 'store_required':
        return 'Crear tienda';
      case 'store_suspended':
        return 'Tienda suspendida';
      case 'catalog_required':
      case 'catalog_ready':
        return store?.name ?? 'Tu tienda';
      default:
        return hasPendingVerificationRequest ? 'Revision pendiente' : 'Solicitar validacion';
    }
  }, [hasPendingVerificationRequest, isAuthenticated, isProfileLoading, profile, sellerState, store]);

  const sellerStateDescription = useMemo(() => {
    switch (sellerState) {
      case 'verification_pending':
        return 'Tu solicitud esta en revision.';
      case 'verification_rejected':
        return 'Puedes enviar una nueva solicitud con datos actualizados.';
      case 'seller_suspended':
        return 'La venta esta pausada mientras se revisa tu cuenta.';
      case 'store_required':
        return 'Crea tu tienda para empezar a preparar tu catalogo.';
      case 'store_suspended':
        return 'Tu tienda esta pausada temporalmente.';
      case 'catalog_required':
        return 'Tu tienda esta activa. Agrega tu primer producto.';
      case 'catalog_ready':
        return 'Tu tienda esta activa y lista para seguir vendiendo.';
      default:
        return 'Completa la validacion para activar tus herramientas de venta.';
    }
  }, [sellerState]);

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
      setSellerState('verification_pending');
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
      const logoUrl = storeForm.logo ? await uploadStoreLogo(storeForm.logo, storeForm.logoZoom) : null;
      const nextStore = await createStore(accessToken, {
        name,
        description: storeForm.description.trim() || null,
        logo_url: logoUrl,
      });
      setStore(nextStore);
      setSellerState('catalog_required');
      saveSellerState({ sellerState: 'catalog_required', store: nextStore, products });
      setStoreForm(initialStoreForm);
      setMessage('Tienda creada y activa.');
    } catch (error) {
      await loadSellerState().catch(() => undefined);
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la tienda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickStoreLogo = async () => {
    setMessage(null);

    try {
      const image = await pickStoreLogo();

      if (image) {
        setStoreForm((current) => ({ ...current, logo: image }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos seleccionar la imagen de la tienda.');
    }
  };

  const handleTakeStoreLogo = async () => {
    setMessage(null);

    try {
      const image = await takeStoreLogo();

      if (image) {
        setStoreForm((current) => ({ ...current, logo: image }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos tomar la imagen de la tienda.');
    }
  };

  const handleCreateProduct = async () => {
    if (!accessToken || !canCreateProducts || !store) {
      return;
    }

    const name = productForm.name.trim();
    const description = productForm.description.trim();
    const price = Number(productForm.price.replace(',', '.'));
    const stock = Number(productForm.stock);

    if (name.length < 3) {
      setMessage('Ingresa un titulo de producto valido.');
      return;
    }

    if (description.length < 10) {
      setMessage('Ingresa una descripcion de al menos 10 caracteres.');
      return;
    }

    if (!productForm.categoryId) {
      setMessage('Selecciona una categoria para el producto.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0 || price > 9999999.99) {
      setMessage('Ingresa un precio valido mayor a cero.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setMessage('Ingresa una cantidad disponible valida.');
      return;
    }

    if (!productForm.image) {
      setMessage('Agrega una imagen del producto desde la camara o galeria.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    const shouldPublishProduct = productForm.publishNow;

    try {
      const imageUrl = await uploadProductImage(store.id, productForm.image);
      const nextProduct = await createProduct(accessToken, {
        category_id: productForm.categoryId,
        name,
        description,
        images: [{ url: imageUrl, alt_text: name }],
        price_cents: Math.round(price * 100),
        stock,
        status: shouldPublishProduct ? 'active' : 'draft',
      });
      setProducts((current) => {
        const nextProducts = [nextProduct, ...current];
        const nextState = nextProducts.length > 0 ? 'catalog_ready' : 'catalog_required';

        setSellerState(nextState);
        saveSellerState({ sellerState: nextState, store, products: nextProducts });

        return nextProducts;
      });
      resetProductForm();
      setProductSuccess({
        title: shouldPublishProduct
          ? 'Tu producto ha sido publicado correctamente'
          : 'Tu producto ha sido guardado correctamente',
        description: shouldPublishProduct
          ? 'Ya esta listo para aparecer en el catalogo de nexo.'
          : 'Quedo como borrador en tu centro de ventas.',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el producto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExploreProducts = () => {
    setProductSuccess(null);
    onExploreProducts();
  };

  const handlePublishAnother = () => {
    setProductSuccess(null);
    resetProductForm();
  };

  const handlePickProductImage = async () => {
    setMessage(null);

    try {
      const image = await pickProductImage();

      if (image) {
        setProductForm((current) => ({ ...current, image }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos seleccionar la imagen.');
    }
  };

  const handleTakeProductImage = async () => {
    setMessage(null);

    try {
      const image = await takeProductImage();

      if (image) {
        setProductForm((current) => ({ ...current, image }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos tomar la foto.');
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

  if (!profile) {
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
      <ProductSuccessDialog
        description={productSuccess?.description ?? ''}
        title={productSuccess?.title ?? ''}
        visible={productSuccess !== null}
        onExploreProducts={handleExploreProducts}
        onPublishAnother={handlePublishAnother}
      />

      <SectionTitle title="Centro de ventas" subtitle="Verificacion, tienda e inventario." />

      <View style={styles.statusPanel}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIdentity}>
            <View style={styles.statusIcon}>
              {store?.logo_url ? (
                <Image source={{ uri: store.logo_url }} style={styles.statusLogo} />
              ) : (
                <Ionicons name="storefront-outline" size={23} color={colors.brandBlue} />
              )}
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>{sellerStep}</Text>
              <Text style={styles.statusSubtitle}>{sellerStateDescription}</Text>
            </View>
          </View>
        </View>
      </View>

      {message && (
        <View style={styles.messagePanel}>
          <Ionicons name="information-circle-outline" size={17} color={colors.brandBlue} />
          <Text style={styles.message}>{message}</Text>
        </View>
      )}

      {(sellerState === 'verification_required' || (!sellerState && profile.role === 'buyer' && profile.verification_status === 'pending')) && !hasPendingVerificationRequest ? (
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

      {(hasPendingVerificationRequest || sellerState === 'verification_pending') && (
        <LogicCard
          title="Solicitud en revision"
          description="Tu cuenta sigue como buyer hasta que un administrador apruebe la validacion de vendedor."
        />
      )}

      {sellerState === 'verification_rejected' && (
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

      {sellerState === 'seller_suspended' && (
        <LogicCard
          title="Venta pausada"
          description="Tu tienda queda fuera del catalogo publico hasta que un administrador revise la suspension."
        />
      )}

      {sellerState === 'store_suspended' && (
        <LogicCard
          title="Tienda pausada"
          description="Tu tienda queda fuera del catalogo publico y no puede vender hasta que un administrador la reactive."
        />
      )}

      {sellerState === 'store_required' && (
        <CreateStoreForm
          form={storeForm}
          isLoading={isLoading}
          onChange={setStoreForm}
          onCreateStore={handleCreateStore}
          onPickLogo={handlePickStoreLogo}
          onTakeLogo={handleTakeStoreLogo}
        />
      )}

      {(sellerState === 'catalog_required' || sellerState === 'catalog_ready') && canCreateProducts && (
        <ProductCreateForm
          categories={categories}
          categoryError={categoryError}
          form={productForm}
          isCategoriesLoading={isCategoriesLoading}
          isLoading={isLoading}
          onChange={setProductForm}
          onCreateProduct={handleCreateProduct}
          onPickImage={handlePickProductImage}
          onRefreshCategories={refreshCategories}
          onTakeImage={handleTakeProductImage}
        />
      )}

      <SellerProductList products={products} isLoading={isSellerLoading} />

    </>
  );
}
