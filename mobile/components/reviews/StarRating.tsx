import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

type StarRatingProps = {
  rating: number;       // 0–5, supports decimals for display
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
};

export function StarRating({ rating, size = 14, interactive = false, onRate }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        const iconName = filled ? 'star' : half ? 'star-half' : 'star-outline';

        if (interactive && onRate) {
          return (
            <Pressable
              key={star}
              accessibilityLabel={`${star} estrella${star > 1 ? 's' : ''}`}
              accessibilityRole="button"
              hitSlop={6}
              onPress={() => onRate(star)}
            >
              <Ionicons
                name={iconName}
                size={size}
                color={filled || half ? colors.popYellow : colors.silver}
              />
            </Pressable>
          );
        }

        return (
          <Ionicons
            key={star}
            name={iconName}
            size={size}
            color={filled || half ? colors.popYellow : colors.silver}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
});
