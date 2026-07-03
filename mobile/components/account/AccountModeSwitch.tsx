import { Pressable, Text, View } from 'react-native';
import type { AccountMode } from '../../types/account';
import { accountStyles as styles } from './accountStyles';

type AccountModeSwitchProps = {
  mode: Extract<AccountMode, 'login' | 'register'>;
  onChangeMode: (mode: Extract<AccountMode, 'login' | 'register'>) => void;
};

const visibleModes: Array<{ key: Extract<AccountMode, 'login' | 'register'>; label: string }> = [
  { key: 'login', label: 'Iniciar sesion' },
  { key: 'register', label: 'Crear cuenta' },
];

export function AccountModeSwitch({ mode, onChangeMode }: AccountModeSwitchProps) {
  return (
    <View style={styles.switchRow}>
      {visibleModes.map((item) => {
        const isActive = item.key === mode;

        return (
          <Pressable
            key={item.key}
            style={[styles.switchButton, isActive && styles.switchButtonActive]}
            onPress={() => onChangeMode(item.key)}
          >
            <Text style={[styles.switchText, isActive && styles.switchTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
