import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../theme/colors';

type LogicCardProps = {
  title: string;
  description: string;
};

export function LogicCard({ title, description }: LogicCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 19,
  },
});
