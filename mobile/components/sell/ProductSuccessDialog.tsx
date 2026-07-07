import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { styles } from './sellStyles';

type ProductSuccessDialogProps = {
  description: string;
  title: string;
  visible: boolean;
  onExploreProducts: () => void;
  onPublishAnother: () => void;
};

export function ProductSuccessDialog({
  description,
  title,
  visible,
  onExploreProducts,
  onPublishAnother,
}: ProductSuccessDialogProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onPublishAnother}>
      <View style={styles.dialogOverlay}>
        <View style={styles.successDialog}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={26} color={colors.surface} />
          </View>
          <Text style={styles.successTitle}>{title}</Text>
          <Text style={styles.successDescription}>{description}</Text>
          <View style={styles.successActions}>
            <Pressable
              style={({ pressed }) => [styles.successPrimaryButton, pressed && styles.buttonPressed]}
              onPress={onExploreProducts}
            >
              <Ionicons name="compass-outline" size={17} color={colors.surface} />
              <Text style={styles.successPrimaryText}>Explorar productos</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.successSecondaryButton, pressed && styles.buttonPressed]}
              onPress={onPublishAnother}
            >
              <Ionicons name="add-circle-outline" size={17} color={colors.brandBlue} />
              <Text style={styles.successSecondaryText}>Publicar otro</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
