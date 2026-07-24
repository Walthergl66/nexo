import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { LogicCard } from '../../components/cards/LogicCard';
import { SectionTitle } from '../../components/common/SectionTitle';
import { PrimaryButton } from '../../components/sell/FormControls';
import { SellerOnboarding } from '../../components/sell/SellerOnboarding';
import { SellerSectionTabs } from '../../components/sell/SellerSectionTabs';
import { CatalogSection } from '../../components/sell/sections/CatalogSection';
import { PublishSection } from '../../components/sell/sections/PublishSection';
import { SalesSection } from '../../components/sell/sections/SalesSection';
import { styles } from '../../components/sell/sellStyles';
import { createStore, fetchProfile, submitSellerVerification } from '../../services/marketplaceApi';
import { pickStoreLogo, takeStoreLogo, uploadStoreLogo } from '../../services/storeLogoService';
import { colors } from '../../theme/colors';
import { initialStoreForm, initialVerificationForm } from '../../constants/sell';
import { useSellCategories } from '../../hooks/sell/useSellCategories';
import { useSellerCenter } from '../../hooks/sell/useSellerCenter';
import { useSellerProducts } from '../../hooks/sell/useSellerProducts';
import { useSellerSales } from '../../hooks/sell/useSellerSales';
import type { Sale } from '../../types/marketplace';
import type { SellerSection, SellScreenProps } from '../../types/sell';
import type { StatusTone } from '../../types/status';

export function SellScreen({
  accessToken,
  profile,
  isProfileLoading,
  onExploreProducts,
  onGoToAccount,
  onProfileChange,
  onStatusMessage,
}: SellScreenProps) {
  const [verificationForm, setVerificationForm] = useState(initialVerificationForm);
  const [storeForm, setStoreForm] = useState(initialStoreForm);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SellerSection>('catalog');

  const notify = useCallback(
    (nextMessage: string, tone: StatusTone = 'info') => {
      if (onStatusMessage) {
        onStatusMessage(nextMessage, tone);
        return;
      }
      setMessage(nextMessage);
    },
    [onStatusMessage],
  );

  const handleSellerLoaded = useCallback(() => setMessage(null), []);
  const handleSellerError = useCallback((nextMessage: string) => notify(nextMessage, 'error'), [notify]);

  const categories = useSellCategories();
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
  } = useSellerCenter({ accessToken, profile, onError: handleSellerError, onLoaded: handleSellerLoaded, onProfileChange });

  const isAuthenticated = accessToken !== null;
  const isApprovedSeller = profile?.role === 'seller' && profile.verification_status === 'approved';
  const canCreateProducts = isApprovedSeller && store?.status === 'active';
  const canManageSales = isApprovedSeller && Boolean(store);
  const isSellerActive = sellerState === 'catalog_required' || sellerState === 'catalog_ready';

  const productCtl = useSellerProducts({
    accessToken,
    store,
    canCreateProducts,
    products,
    setProducts,
    setSellerState,
    saveSellerState,
    notify,
    onExploreProducts,
  });

  const { sales, isLoading: isSalesLoading, advancingId, advance } = useSellerSales({
    accessToken,
    enabled: canManageSales,
    onError: handleSellerError,
  });

  const handleAdvanceSale = useCallback(
    (sale: Sale) => {
      if (sale.nextStatus) {
        void advance(sale.id, sale.nextStatus);
      }
    },
    [advance],
  );

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
      notify('Ingresa el nombre comercial de tu emprendimiento.', 'warning');
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
      notify('Solicitud enviada. Un administrador debe revisarla.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.', 'error');
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
      notify('Ingresa un nombre de tienda valido.', 'warning');
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
      setActiveSection('publish');
      notify('Tienda creada y activa.', 'success');
    } catch (error) {
      await loadSellerState().catch(() => undefined);
      notify(error instanceof Error ? error.message : 'No se pudo crear la tienda.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickStoreLogo = async () => {
    try {
      const image = await pickStoreLogo();
      if (image) {
        setStoreForm((current) => ({ ...current, logo: image }));
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No pudimos seleccionar la imagen de la tienda.', 'error');
    }
  };

  const handleTakeStoreLogo = async () => {
    try {
      const image = await takeStoreLogo();
      if (image) {
        setStoreForm((current) => ({ ...current, logo: image }));
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No pudimos tomar la imagen de la tienda.', 'error');
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
          <PrimaryButton disabled={false} icon="log-in-outline" label="Entrar o crear cuenta" loading={false} onPress={onGoToAccount} />
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

      {isSellerActive ? (
        <>
          <SellerSectionTabs active={activeSection} onChange={setActiveSection} salesCount={sales.length} />

          {activeSection === 'publish' && <PublishSection productCtl={productCtl} categories={categories} />}

          {activeSection === 'catalog' && (
            <CatalogSection
              productCtl={productCtl}
              categories={categories}
              products={products}
              isListLoading={isSellerLoading}
              canManage={Boolean(canCreateProducts)}
            />
          )}

          {activeSection === 'sales' && (
            <SalesSection
              canManageSales={canManageSales}
              sales={sales}
              isLoading={isSalesLoading}
              advancingId={advancingId}
              onAdvance={handleAdvanceSale}
            />
          )}
        </>
      ) : (
        <SellerOnboarding
          sellerState={sellerState}
          hasPendingVerificationRequest={hasPendingVerificationRequest}
          profile={profile}
          isLoading={isLoading}
          verificationForm={verificationForm}
          onChangeVerification={setVerificationForm}
          onRequestVerification={handleRequestVerification}
          storeForm={storeForm}
          onChangeStore={setStoreForm}
          onCreateStore={handleCreateStore}
          onPickStoreLogo={handlePickStoreLogo}
          onTakeStoreLogo={handleTakeStoreLogo}
        />
      )}
    </>
  );
}
