import { Image, Platform, Text, View } from 'react-native';
import { accountStyles as styles } from './accountStyles';

type AuthBrandHeaderProps = {
  subtitle: string;
  title: string;
  variant?: 'default' | 'recovery' | 'register';
};

export function AuthBrandHeader({ subtitle, title, variant = 'default' }: AuthBrandHeaderProps) {
  const isRecovery = variant === 'recovery';
  const isRegister = variant === 'register';

  return (
    <View style={[styles.authBrandHeader, isRecovery && styles.authBrandHeaderRecovery, isRegister && styles.authBrandHeaderRegister]}>
      <View style={[styles.authLogoWrap, isRecovery && styles.authLogoWrapRecovery, isRegister && styles.authLogoWrapRegister]}>
        {Platform.OS === 'web' ? (
          <img
            src={isRecovery ? '/nexo-logo-simbolo.svg' : '/nexo-logo-completo.svg'}
            alt="Nexo"
            style={{
              ...(styles.authLogo as unknown as React.CSSProperties),
              ...(isRecovery ? (styles.authLogoRecovery as unknown as React.CSSProperties) : {}),
              ...(isRegister ? (styles.authLogoRegister as unknown as React.CSSProperties) : {}),
            }}
          />
        ) : (
          <Image
            source={require('../../assets/icon.png')}
            style={[styles.authLogo, isRecovery && styles.authLogoRecovery, isRegister && styles.authLogoRegister]}
          />
        )}
      </View>
      <View style={[styles.authBrandCopy, isRecovery && styles.authBrandCopyRecovery]}>
        <Text style={styles.authBrandTitle}>{title}</Text>
        <Text style={styles.authBrandSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
