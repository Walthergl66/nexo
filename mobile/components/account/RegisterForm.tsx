import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import type { IdentityLookup } from '../../services/marketplaceApi';
import { colors } from '../../theme/colors';
import { genderOptions, type RegisterForm as RegisterFormState } from '../../types/account';
import {
  getPasswordRequirements,
  isRegisterAccountStepValid,
  isRegisterContactStepValid,
} from '../../utils/accountValidation';
import { AuthBrandHeader } from './AuthBrandHeader';
import { accountStyles as styles } from './accountStyles';
import { RegisterHeader } from './RegisterHeader';

type RegisterStep = 1 | 2 | 3;

type RegisterFormProps = {
  form: RegisterFormState;
  identity: IdentityLookup | null;
  identityError: string | null;
  registrationError: string | null;
  isConfirmPasswordVisible: boolean;
  isGenderOpen: boolean;
  isLoading: boolean;
  isPasswordVisible: boolean;
  passwordError: string | null;
  onChangeField: (key: keyof RegisterFormState, value: string) => void;
  onLookupIdentity: () => void;
  onSubmit: () => void;
  onToggleConfirmPasswordVisibility: () => void;
  onToggleGender: () => void;
  onTogglePasswordVisibility: () => void;
};

export function RegisterForm({
  form,
  identity,
  identityError,
  registrationError,
  isConfirmPasswordVisible,
  isGenderOpen,
  isLoading,
  isPasswordVisible,
  passwordError,
  onChangeField,
  onLookupIdentity,
  onSubmit,
  onToggleConfirmPasswordVisibility,
  onToggleGender,
  onTogglePasswordVisibility,
}: RegisterFormProps) {
  const [step, setStep] = useState<RegisterStep>(1);
  const confirmEmailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const isIdentityValid = identity !== null && identity.national_id === form.nationalId;
  const isAccountValid = isRegisterAccountStepValid(form, passwordError);
  const isContactValid = isRegisterContactStepValid(form);
  const normalizedEmail = form.email.trim().toLowerCase();
  const normalizedConfirmEmail = form.confirmEmail.trim().toLowerCase();
  const emailsMatch = normalizedEmail !== '' && normalizedEmail === normalizedConfirmEmail;
  const passwordsMatch = form.confirmPassword !== '' && form.password === form.confirmPassword;
  const passwordRequirements = useMemo(() => getPasswordRequirements(form.password), [form.password]);
  const registrationErrorLower = registrationError?.toLowerCase() ?? '';
  const hasEmailRegistrationError = registrationErrorLower.includes('correo');
  const hasNationalIdRegistrationError = registrationErrorLower.includes('cedula');
  const isIdentityStepReady = isIdentityValid && !hasNationalIdRegistrationError;
  const isAccountStepReady = isAccountValid && !hasEmailRegistrationError;

  useEffect(() => {
    if (hasEmailRegistrationError) {
      setStep(2);
    } else if (hasNationalIdRegistrationError) {
      setStep(1);
    }
  }, [hasEmailRegistrationError, hasNationalIdRegistrationError]);

  return (
    <View style={styles.registerFlow}>
      <RegisterHeader step={step} />

      {step === 1 && (
        <View style={styles.registerStepContent}>
          <AuthBrandHeader
            title="Verifica tu identidad"
            subtitle="Ingresa tu cedula para validar tus datos personales."
            variant="register"
          />

          <View style={styles.identityLookupRow}>
            <View style={styles.identityFieldWrap}>
              <Text style={styles.inputLabel}>Cedula</Text>
              <TextInput
                accessibilityLabel="Cedula"
                accessibilityHint="Ingresa los 10 digitos de tu cedula"
                autoComplete="off"
                enterKeyHint="send"
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10 digitos"
                placeholderTextColor={colors.inkSoft}
                returnKeyType="send"
                style={[styles.input, identityError && styles.inputError]}
                value={form.nationalId}
                onChangeText={(value) => onChangeField('nationalId', value.replace(/\D+/g, '').slice(0, 10))}
                onSubmitEditing={() => {
                  if (/^\d{10}$/.test(form.nationalId) && !isLoading) onLookupIdentity();
                }}
              />
            </View>
            <Pressable
              accessibilityLabel="Validar cedula"
              accessibilityRole="button"
              disabled={isLoading || !/^\d{10}$/.test(form.nationalId)}
              style={({ pressed }) => [
                styles.lookupButton,
                (isLoading || !/^\d{10}$/.test(form.nationalId)) && styles.registerButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={onLookupIdentity}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color={colors.surface} size="small" />
                  <Text style={styles.lookupButtonText}>Validando</Text>
                </>
              ) : isIdentityValid ? (
                <Ionicons name="checkmark" size={22} color={colors.surface} />
              ) : (
                <Text style={styles.lookupButtonText}>Validar</Text>
              )}
            </Pressable>
          </View>
          {(identityError || (hasNationalIdRegistrationError ? registrationError : null)) && (
            <FieldMessage tone="error" text={identityError ?? registrationError!} />
          )}

          {isIdentityValid && <IdentityVerifiedCard form={form} />}

          <Pressable
            accessibilityRole="button"
            disabled={!isIdentityStepReady || isLoading}
            style={({ pressed }) => [
              styles.primaryButton,
              (!isIdentityStepReady || isLoading) && styles.registerButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setStep(2)}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.surface} />
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <View style={styles.registerStepContent}>
          <StepIntro title="Configura tu cuenta" description="Ingresa tus datos de acceso y seguridad." />
          <GenderSelect form={form} isGenderOpen={isGenderOpen} onChangeField={onChangeField} onToggleGender={onToggleGender} />

          <FormField label="Correo">
            <TextInput
              accessibilityLabel="Correo"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.inkSoft}
              returnKeyType="next"
              style={styles.input}
              textContentType="emailAddress"
              value={form.email}
              onBlur={() => onChangeField('email', form.email.trim())}
              onChangeText={(value) => onChangeField('email', value)}
              onSubmitEditing={() => confirmEmailRef.current?.focus()}
            />
          </FormField>

          <FormField label="Confirmar correo">
            <TextInput
              ref={confirmEmailRef}
              accessibilityLabel="Confirmar correo"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Repite tu correo"
              placeholderTextColor={colors.inkSoft}
              returnKeyType="next"
              style={[
                styles.input,
                form.confirmEmail !== '' && !emailsMatch && styles.inputError,
                emailsMatch && styles.inputSuccess,
              ]}
              textContentType="emailAddress"
              value={form.confirmEmail}
              onBlur={() => onChangeField('confirmEmail', form.confirmEmail.trim())}
              onChangeText={(value) => onChangeField('confirmEmail', value)}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </FormField>
          {form.confirmEmail !== '' && (
            <FieldMessage
              tone={emailsMatch ? 'success' : 'error'}
              text={emailsMatch ? 'Los correos coinciden' : 'Los correos ingresados no coinciden.'}
            />
          )}
          {hasEmailRegistrationError && <FieldMessage tone="error" text={registrationError!} />}

          <PasswordField
            inputRef={passwordRef}
            autoComplete="new-password"
            label="Contrasena"
            placeholder="Minimo 8 caracteres"
            returnKeyType="next"
            value={form.password}
            isVisible={isPasswordVisible}
            onChangeText={(value) => onChangeField('password', value)}
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            onToggleVisibility={onTogglePasswordVisibility}
          />
          {form.password !== '' && (
            <View style={styles.passwordRequirements} accessibilityLabel="Requisitos de contrasena">
              {passwordRequirements.map((requirement) => (
                <FieldMessage
                  key={requirement.label}
                  tone={requirement.met ? 'success' : 'muted'}
                  text={requirement.label}
                />
              ))}
            </View>
          )}

          <PasswordField
            inputRef={confirmPasswordRef}
            autoComplete="new-password"
            label="Confirmar contrasena"
            placeholder="Repite tu contrasena"
            returnKeyType="done"
            value={form.confirmPassword}
            isVisible={isConfirmPasswordVisible}
            hasError={form.confirmPassword !== '' && !passwordsMatch}
            hasSuccess={passwordsMatch}
            onChangeText={(value) => onChangeField('confirmPassword', value)}
            onSubmitEditing={() => {
              if (isAccountStepReady) setStep(3);
            }}
            onToggleVisibility={onToggleConfirmPasswordVisibility}
          />
          {form.confirmPassword !== '' && (
            <FieldMessage
              tone={passwordsMatch ? 'success' : 'error'}
              text={passwordsMatch ? 'Las contrasenas coinciden' : 'Las contrasenas no coinciden.'}
            />
          )}

          <StepNavigation
            primaryLabel="Continuar"
            primaryDisabled={!isAccountStepReady}
            onBack={() => setStep(1)}
            onPrimary={() => setStep(3)}
          />
        </View>
      )}

      {step === 3 && (
        <View style={styles.registerStepContent}>
          <StepIntro title="Datos de contacto" description="Agrega la informacion necesaria para entregas y soporte." />

          <FormField label="Direccion">
            <TextInput
              accessibilityLabel="Direccion"
              autoComplete="street-address"
              blurOnSubmit
              multiline
              numberOfLines={2}
              placeholder="Calle, numero y referencia"
              placeholderTextColor={colors.inkSoft}
              returnKeyType="next"
              style={[styles.input, styles.addressInput, form.address !== '' && form.address.trim().length < 5 && styles.inputError]}
              textAlignVertical="top"
              value={form.address}
              onChangeText={(value) => onChangeField('address', value)}
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </FormField>
          {form.address !== '' && form.address.trim().length < 5 && <FieldMessage tone="error" text="Ingresa una direccion valida." />}

          <FormField label="Telefono">
            <TextInput
              ref={phoneRef}
              accessibilityLabel="Telefono"
              autoComplete="tel"
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="0991234567"
              placeholderTextColor={colors.inkSoft}
              returnKeyType="done"
              style={[styles.input, form.phone !== '' && !/^09\d{8}$/.test(form.phone) && styles.inputError]}
              textContentType="telephoneNumber"
              value={form.phone}
              onChangeText={(value) => onChangeField('phone', value.replace(/\D+/g, '').slice(0, 10))}
              onSubmitEditing={() => {
                if (isContactValid && !isLoading) onSubmit();
              }}
            />
          </FormField>
          {form.phone !== '' && !/^09\d{8}$/.test(form.phone) && (
            <FieldMessage tone="error" text="Ingresa un telefono ecuatoriano de 10 digitos que empiece con 09." />
          )}

          <RegistrationSummary form={form} onEdit={() => setStep(2)} />
          {registrationError && !hasEmailRegistrationError && !hasNationalIdRegistrationError && (
            <FieldMessage tone="error" text={registrationError} />
          )}

          <StepNavigation
            isLoading={isLoading}
            primaryLabel={isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            primaryDisabled={!isContactValid || !isAccountStepReady || !isIdentityStepReady || isLoading}
            onBack={() => setStep(2)}
            onPrimary={onSubmit}
          />
        </View>
      )}

    </View>
  );
}

function StepIntro({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.registerIntro}>
      <Text style={styles.registerTitle}>{title}</Text>
      <Text style={styles.registerDescription}>{description}</Text>
    </View>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.registerField}>
      <Text style={styles.inputLabel}>{label}</Text>
      {children}
    </View>
  );
}

function IdentityVerifiedCard({ form }: { form: RegisterFormState }) {
  const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ');

  return (
    <View accessibilityLabel={`Identidad verificada. ${fullName}`} style={styles.identityCard}>
      <View style={styles.identityIcon}>
        <Ionicons name="checkmark" size={18} color={colors.surface} />
      </View>
      <View style={styles.identityCopy}>
        <Text style={styles.identityEyebrow}>Identidad verificada</Text>
        <Text style={styles.identityName}>{fullName}</Text>
        <Text style={styles.identityMeta}>{form.age ? `${form.age} anos  ·  ` : ''}Cedula: {form.nationalId}</Text>
      </View>
    </View>
  );
}

function RegistrationSummary({ form, onEdit }: { form: RegisterFormState; onEdit: () => void }) {
  return (
    <View style={styles.registrationSummary}>
      <Text style={styles.registrationSummaryTitle}>Resumen de registro</Text>
      <Text style={styles.registrationSummaryName}>{[form.firstName, form.lastName].filter(Boolean).join(' ')}</Text>
      <Text style={styles.registrationSummaryValue}>{form.email.trim().toLowerCase()}</Text>
      <Text style={styles.registrationSummaryValue}>{form.gender}</Text>
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onEdit}>
        <Text style={styles.registrationSummaryLink}>Editar datos de cuenta</Text>
      </Pressable>
    </View>
  );
}

function FieldMessage({ tone, text }: { tone: 'success' | 'error' | 'muted'; text: string }) {
  const icon = tone === 'success' ? 'checkmark-circle' : tone === 'error' ? 'alert-circle' : 'ellipse-outline';

  return (
    <View style={styles.fieldMessageRow}>
      <Ionicons
        name={icon}
        size={15}
        color={tone === 'success' ? '#177A65' : tone === 'error' ? '#9F1239' : colors.inkSoft}
      />
      <Text style={[styles.fieldMessageText, tone === 'success' && styles.fieldMessageSuccess, tone === 'error' && styles.fieldMessageError]}>
        {text}
      </Text>
    </View>
  );
}

function GenderSelect({
  form,
  isGenderOpen,
  onChangeField,
  onToggleGender,
}: {
  form: RegisterFormState;
  isGenderOpen: boolean;
  onChangeField: (key: keyof RegisterFormState, value: string) => void;
  onToggleGender: () => void;
}) {
  return (
    <View style={styles.registerField}>
      <Text style={styles.inputLabel}>Genero</Text>
      <Pressable
        accessibilityLabel="Seleccionar genero"
        accessibilityRole="button"
        accessibilityState={{ expanded: isGenderOpen }}
        style={({ pressed }) => [styles.selectTrigger, pressed && styles.selectTriggerPressed]}
        onPress={onToggleGender}
      >
        <Text numberOfLines={1} style={[styles.selectValue, form.gender === '' && styles.selectPlaceholder]}>
          {form.gender || 'Selecciona una opcion'}
        </Text>
        <Ionicons name={isGenderOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.inkMuted} />
      </Pressable>
      {isGenderOpen && (
        <View style={styles.selectOptions}>
          {genderOptions.map((option) => {
            const isSelected = form.gender === option;

            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [styles.selectOption, isSelected && styles.selectOptionActive, pressed && styles.selectOptionPressed]}
                onPress={() => onChangeField('gender', option)}
              >
                <Text numberOfLines={1} style={[styles.selectOptionText, isSelected && styles.selectOptionTextActive]}>{option}</Text>
                {isSelected && <Ionicons name="checkmark" size={17} color={colors.brandBlue} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function PasswordField({
  inputRef,
  autoComplete,
  hasError = false,
  hasSuccess = false,
  isVisible,
  label,
  placeholder,
  returnKeyType,
  value,
  onChangeText,
  onSubmitEditing,
  onToggleVisibility,
}: {
  inputRef: React.RefObject<TextInput | null>;
  autoComplete: 'new-password';
  hasError?: boolean;
  hasSuccess?: boolean;
  isVisible: boolean;
  label: string;
  placeholder: string;
  returnKeyType: 'next' | 'done';
  value: string;
  onChangeText: (value: string) => void;
  onSubmitEditing: () => void;
  onToggleVisibility: () => void;
}) {
  return (
    <View style={styles.registerField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordInputWrap}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoComplete={autoComplete}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSoft}
          returnKeyType={returnKeyType}
          secureTextEntry={!isVisible}
          style={[styles.input, styles.passwordInput, hasError && styles.inputError, hasSuccess && styles.inputSuccess]}
          textContentType="newPassword"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
        />
        <Pressable
          accessibilityLabel={isVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          accessibilityRole="button"
          hitSlop={4}
          style={({ pressed }) => [styles.passwordToggle, pressed && styles.buttonPressed]}
          onPress={onToggleVisibility}
        >
          <Ionicons name={isVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function StepNavigation({
  isLoading = false,
  primaryDisabled,
  primaryLabel,
  onBack,
  onPrimary,
}: {
  isLoading?: boolean;
  primaryDisabled: boolean;
  primaryLabel: string;
  onBack: () => void;
  onPrimary: () => void;
}) {
  return (
    <View style={styles.stepNavigation}>
      <Pressable
        accessibilityRole="button"
        disabled={isLoading}
        style={({ pressed }) => [styles.stepBackButton, pressed && styles.buttonPressed]}
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={17} color={colors.brandBlue} />
        <Text style={styles.secondaryButtonText}>Atras</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={primaryDisabled}
        style={({ pressed }) => [styles.stepPrimaryButton, primaryDisabled && styles.registerButtonDisabled, pressed && styles.buttonPressed]}
        onPress={onPrimary}
      >
        {isLoading && <ActivityIndicator color={colors.surface} size="small" />}
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </Pressable>
    </View>
  );
}
