import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { genderOptions, type RegisterForm as RegisterFormState } from '../../types/account';
import { AuthBrandHeader } from './AuthBrandHeader';
import { accountStyles as styles } from './accountStyles';

type RegisterFormProps = {
  form: RegisterFormState;
  isConfirmPasswordVisible: boolean;
  isGenderOpen: boolean;
  isLoading: boolean;
  isPasswordVisible: boolean;
  message: string | null;
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
  isConfirmPasswordVisible,
  isGenderOpen,
  isLoading,
  isPasswordVisible,
  message,
  passwordError,
  onChangeField,
  onLookupIdentity,
  onSubmit,
  onToggleConfirmPasswordVisibility,
  onToggleGender,
  onTogglePasswordVisibility,
}: RegisterFormProps) {
  return (
    <View style={[styles.accountCard, styles.registerCard]}>
      <AuthBrandHeader
        title="Crear cuenta"
        subtitle="Completa tus datos para activar compras seguras y acceso a ventas."
      />
      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Identidad</Text>
          <Text style={styles.sectionHint}>Validacion por cedula</Text>
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
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Datos de cuenta</Text>
          <Text style={styles.sectionHint}>Correo y seguridad</Text>
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
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Contacto</Text>
          <Text style={styles.sectionHint}>Para entregas y soporte</Text>
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
      </View>

      <Pressable
        disabled={isLoading}
        style={({ pressed }) => [styles.primaryButton, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}
        onPress={onSubmit}
      >
        {isLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Crear cuenta</Text>}
      </Pressable>
      {message && <Text style={styles.formMessage}>{message}</Text>}
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
