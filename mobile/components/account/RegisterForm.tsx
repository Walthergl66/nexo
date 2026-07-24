import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { genderOptions, type RegisterForm as RegisterFormState } from '../../types/account';
import { validateRegisterStep } from '../../utils/accountValidation';
import { AuthBrandHeader } from './AuthBrandHeader';
import { accountStyles as styles } from './accountStyles';

type RegisterStep = 1 | 2 | 3;

type RegisterFormProps = {
  form: RegisterFormState;
  identityNationalId: string | null;
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
  identityNationalId,
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
  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    setStepError(null);
  }, [form]);

  const goToNextStep = () => {
    const validationMessage = validateRegisterStep({
      form,
      identityNationalId,
      passwordError,
      step: currentStep,
    });

    if (validationMessage !== null) {
      setStepError(validationMessage);
      return;
    }

    setStepError(null);
    setCurrentStep((step) => Math.min(step + 1, 3) as RegisterStep);
  };

  const goToPreviousStep = () => {
    setIsGenderOpenIfNeeded();
    setStepError(null);
    setCurrentStep((step) => Math.max(step - 1, 1) as RegisterStep);
  };

  const setIsGenderOpenIfNeeded = () => {
    if (isGenderOpen) {
      onToggleGender();
    }
  };

  const handleSubmit = () => {
    const validationMessage = validateRegisterStep({
      form,
      identityNationalId,
      passwordError,
      step: 3,
    });

    if (validationMessage !== null) {
      setStepError(validationMessage);
      return;
    }

    setStepError(null);
    onSubmit();
  };

  return (
    <View style={[styles.accountCard, styles.registerCard]}>
      <AuthBrandHeader
        title="Crear cuenta"
        subtitle="Completa tus datos para activar compras seguras y acceso a ventas."
      />
      <RegisterProgress currentStep={currentStep} />

      {currentStep === 1 && <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Identidad</Text>
          <Text style={styles.sectionHint}>Paso 1 de 3</Text>
        </View>
        <View style={styles.inlineRow}>
          <View style={styles.fieldWrap}>
            <Text style={styles.inputLabel}>Cedula</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={10}
              placeholder="10 digitos"
              placeholderTextColor={colors.inkSoft}
              style={styles.input}
              value={form.nationalId}
              onChangeText={(value) => onChangeField('nationalId', value.replace(/\D+/g, '').slice(0, 10))}
            />
          </View>
          <Pressable
            disabled={isLoading}
            style={({ pressed }) => [styles.lookupButton, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}
            onPress={onLookupIdentity}
          >
            <Text style={styles.lookupButtonText}>Validar</Text>
          </Pressable>
        </View>
        <View style={styles.inlineRow}>
          <View style={styles.fieldWrap}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              editable={false}
              placeholder="Se completa al validar"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.inputDisabled]}
              value={form.firstName}
            />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.inputLabel}>Apellido</Text>
            <TextInput
              editable={false}
              placeholder="Se completa al validar"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.inputDisabled]}
              value={form.lastName}
            />
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Edad</Text>
          <TextInput
            editable={false}
            placeholder="Se calcula al validar"
            placeholderTextColor={colors.inkSoft}
            style={[styles.input, styles.inputDisabled]}
            value={form.age}
          />
        </View>
      </View>}

      {currentStep === 2 && <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Datos de cuenta</Text>
          <Text style={styles.sectionHint}>Paso 2 de 3</Text>
        </View>
        <GenderSelect form={form} isGenderOpen={isGenderOpen} onChangeField={onChangeField} onToggleGender={onToggleGender} />
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Correo</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={form.email}
            onChangeText={(value) => onChangeField('email', value)}
          />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Confirmar correo</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Repite tu correo"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={form.confirmEmail}
            onChangeText={(value) => onChangeField('confirmEmail', value)}
          />
        </View>
        <PasswordField
          label="Contraseña"
          placeholder="Minimo 8 caracteres"
          value={form.password}
          isVisible={isPasswordVisible}
          onChangeText={(value) => onChangeField('password', value)}
          onToggleVisibility={onTogglePasswordVisibility}
        />
        {passwordError && <Text style={styles.validationText}>{passwordError}</Text>}
        <PasswordField
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          value={form.confirmPassword}
          isVisible={isConfirmPasswordVisible}
          onChangeText={(value) => onChangeField('confirmPassword', value)}
          onToggleVisibility={onToggleConfirmPasswordVisibility}
        />
      </View>}

      {currentStep === 3 && <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Contacto</Text>
          <Text style={styles.sectionHint}>Paso 3 de 3</Text>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Direccion</Text>
          <TextInput
            placeholder="Calle, numero, referencia"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={form.address}
            onChangeText={(value) => onChangeField('address', value)}
          />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Telefono</Text>
          <TextInput
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="0991234567"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            value={form.phone}
            onChangeText={(value) => onChangeField('phone', value.replace(/\D+/g, '').slice(0, 10))}
          />
        </View>
      </View>}

      {stepError && <Text style={styles.stepValidationText}>{stepError}</Text>}

      <View style={styles.registerActions}>
        {currentStep > 1 && (
          <Pressable
            disabled={isLoading}
            style={({ pressed }) => [
              styles.secondaryButton,
              styles.registerActionButton,
              isLoading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={goToPreviousStep}
          >
            <Text style={styles.secondaryButtonText}>Atrás</Text>
          </Pressable>
        )}
        <Pressable
          disabled={isLoading}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.registerActionButton,
            isLoading && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={currentStep === 3 ? handleSubmit : goToNextStep}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>{currentStep === 3 ? 'Crear cuenta' : 'Continuar'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function RegisterProgress({ currentStep }: { currentStep: RegisterStep }) {
  const steps = ['Identidad', 'Cuenta', 'Contacto'];

  return (
    <View accessibilityLabel={`Paso ${currentStep} de 3: ${steps[currentStep - 1]}`} style={styles.registerProgress}>
      <Text style={styles.progressEyebrow}>Paso {currentStep} de 3</Text>
      <View style={styles.progressTrack}>
        {steps.map((label, index) => {
          const step = (index + 1) as RegisterStep;
          const isComplete = step < currentStep;
          const isActive = step === currentStep;

          return (
            <View key={label} style={styles.progressItem}>
              <View style={styles.progressMarkerRow}>
                {index > 0 && <View style={[styles.progressLine, step <= currentStep && styles.progressLineActive]} />}
                <View style={[styles.progressDot, (isComplete || isActive) && styles.progressDotActive]}>
                  {isComplete ? (
                    <Ionicons name="checkmark" size={13} color={colors.surface} />
                  ) : (
                    <View style={[styles.progressDotCore, isActive && styles.progressDotCoreActive]} />
                  )}
                </View>
                {index < steps.length - 1 && (
                  <View style={[styles.progressLine, step < currentStep && styles.progressLineActive]} />
                )}
              </View>
              <Text style={[styles.progressLabel, (isComplete || isActive) && styles.progressLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
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
    <View style={[styles.fieldWrap, isGenderOpen && styles.genderFieldOpen]}>
      <Text style={styles.inputLabel}>Genero</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Seleccionar genero"
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
                style={({ pressed }) => [
                  styles.selectOption,
                  isSelected && styles.selectOptionActive,
                  pressed && styles.selectOptionPressed,
                ]}
                onPress={() => onChangeField('gender', option)}
              >
                <Text numberOfLines={1} style={[styles.selectOptionText, isSelected && styles.selectOptionTextActive]}>
                  {option}
                </Text>
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
  isVisible,
  label,
  placeholder,
  value,
  onChangeText,
  onToggleVisibility,
}: {
  isVisible: boolean;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordInputWrap}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.inkSoft}
          secureTextEntry={!isVisible}
          style={[styles.input, styles.passwordInput]}
          value={value}
          onChangeText={onChangeText}
        />
        <Pressable
          accessibilityLabel={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={({ pressed }) => [styles.passwordToggle, pressed && styles.buttonPressed]}
          onPress={onToggleVisibility}
        >
          <Ionicons name={isVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
        </Pressable>
      </View>
    </View>
  );
}
