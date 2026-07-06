import { Image, Platform, Text, View } from 'react-native';
import { accountStyles as styles } from './accountStyles';

type AuthBrandHeaderProps = {
  subtitle: string;
  title: string;
  variant?: 'default' | 'recovery';
};

export function AuthBrandHeader({ subtitle, title, variant = 'default' }: AuthBrandHeaderProps) {
  const isRecovery = variant === 'recovery';

  return (
    <View style={[styles.authBrandHeader, isRecovery && styles.authBrandHeaderRecovery]}>
      <View style={[styles.authLogoWrap, isRecovery && styles.authLogoWrapRecovery]}>
        {Platform.OS === 'web' ? (
          <img
            src={isRecovery ? '/nexo-logo-simbolo.svg' : '/nexo-logo-completo.svg'}
            alt="Nexo"
            style={{
              ...(styles.authLogo as unknown as React.CSSProperties),
              ...(isRecovery ? (styles.authLogoRecovery as unknown as React.CSSProperties) : {}),
            }}
          />
        ) : (
          <Image source={require('../../assets/icon.png')} style={[styles.authLogo, isRecovery && styles.authLogoRecovery]} />
        )}
      </View>
      <View style={[styles.authBrandCopy, isRecovery && styles.authBrandCopyRecovery]}>
        <Text style={styles.authBrandTitle}>{title}</Text>
        <Text style={styles.authBrandSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
