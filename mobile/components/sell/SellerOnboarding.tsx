import { TextInput, View } from 'react-native';
import { LogicCard } from '../cards/LogicCard';
import { CreateStoreForm } from './CreateStoreForm';
import { FormHeader, PrimaryButton } from './FormControls';
import { styles } from './sellStyles';
import { colors } from '../../theme/colors';
import type { ProfileResource, SellerCenterState, StoreForm, VerificationForm } from '../../types/sell';

type SellerOnboardingProps = {
  sellerState: SellerCenterState | null;
  hasPendingVerificationRequest: boolean;
  profile: ProfileResource;
  isLoading: boolean;
  verificationForm: VerificationForm;
  onChangeVerification: (form: VerificationForm) => void;
  onRequestVerification: () => void;
  storeForm: StoreForm;
  onChangeStore: (form: StoreForm) => void;
  onCreateStore: () => void;
  onPickStoreLogo: () => void;
  onTakeStoreLogo: () => void;
};

/**
 * Los pasos previos a poder vender: solicitar verificación, esperar revisión,
 * reenviar si fue rechazada, y crear la tienda. Separado del centro de ventas
 * porque es un flujo de "puerta" que se completa una sola vez.
 */
export function SellerOnboarding({
  sellerState,
  hasPendingVerificationRequest,
  profile,
  isLoading,
  verificationForm,
  onChangeVerification,
  onRequestVerification,
  storeForm,
  onChangeStore,
  onCreateStore,
  onPickStoreLogo,
  onTakeStoreLogo,
}: SellerOnboardingProps) {
  const showInitialVerification =
    (sellerState === 'verification_required' ||
      (!sellerState && profile.role === 'buyer' && profile.verification_status === 'pending')) &&
    !hasPendingVerificationRequest;

  return (
    <>
      {showInitialVerification && (
        <VerificationForm
          form={verificationForm}
          isLoading={isLoading}
          onChange={onChangeVerification}
          onSubmit={onRequestVerification}
          title="Solicitud de vendedor"
          subtitle="Datos basicos para que el equipo valide tu emprendimiento."
          descriptionPlaceholder="Que vendes y como operas"
          submitLabel="Enviar solicitud"
        />
      )}

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
          <VerificationForm
            form={verificationForm}
            isLoading={isLoading}
            onChange={onChangeVerification}
            onSubmit={onRequestVerification}
            icon="refresh-circle-outline"
            title="Nueva solicitud"
            subtitle="Actualiza la informacion para una nueva revision."
            descriptionPlaceholder="Que cambiaste de tu solicitud anterior"
            submitLabel="Enviar nueva solicitud"
          />
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
          onChange={onChangeStore}
          onCreateStore={onCreateStore}
          onPickLogo={onPickStoreLogo}
          onTakeLogo={onTakeStoreLogo}
        />
      )}
    </>
  );
}

type VerificationFormProps = {
  form: VerificationForm;
  isLoading: boolean;
  onChange: (form: VerificationForm) => void;
  onSubmit: () => void;
  icon?: 'shield-checkmark-outline' | 'refresh-circle-outline';
  title: string;
  subtitle: string;
  descriptionPlaceholder: string;
  submitLabel: string;
};

function VerificationForm({
  form,
  isLoading,
  onChange,
  onSubmit,
  icon = 'shield-checkmark-outline',
  title,
  subtitle,
  descriptionPlaceholder,
  submitLabel,
}: VerificationFormProps) {
  return (
    <View style={styles.formCard}>
      <FormHeader icon={icon} title={title} subtitle={subtitle} />
      <TextInput
        placeholder="Nombre comercial"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        value={form.businessName}
        onChangeText={(value) => onChange({ ...form, businessName: value })}
      />
      <TextInput
        multiline
        placeholder={descriptionPlaceholder}
        placeholderTextColor={colors.inkSoft}
        style={[styles.input, styles.textArea]}
        value={form.businessDescription}
        onChangeText={(value) => onChange({ ...form, businessDescription: value })}
      />
      <View style={styles.inlineRow}>
        <TextInput
          autoCapitalize="none"
          placeholder="Documento"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, styles.inlineInput]}
          value={form.documentType}
          onChangeText={(value) => onChange({ ...form, documentType: value })}
        />
        <TextInput
          keyboardType="number-pad"
          placeholder="Numero"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, styles.inlineInput]}
          value={form.documentNumber}
          onChangeText={(value) => onChange({ ...form, documentNumber: value })}
        />
      </View>
      <PrimaryButton disabled={isLoading} icon="shield-checkmark" label={submitLabel} loading={isLoading} onPress={onSubmit} />
    </View>
  );
}
