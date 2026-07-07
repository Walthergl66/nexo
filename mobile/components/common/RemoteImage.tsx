import { useMemo, useState } from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';
import { buildSupabaseThumbnailUrl } from '../../utils/image';

type RemoteImageProps = {
  uri: string;
  /** Target render width used to request a resized Supabase thumbnail. */
  width: number;
  quality?: number;
  resizeMode?: 'cover' | 'contain' | 'center' | 'stretch';
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  /** Called when both the thumbnail and the original image fail to load. */
  onFinalError?: () => void;
};

/**
 * Loads a Supabase-hosted image as a resized thumbnail, falling back to the
 * original URL if the transformation endpoint is unavailable, and finally
 * signalling `onFinalError` so callers can render their own placeholder.
 */
export function RemoteImage({
  uri,
  width,
  quality = 70,
  resizeMode = 'cover',
  style,
  accessibilityLabel,
  onFinalError,
}: RemoteImageProps) {
  const thumbnailUri = useMemo(() => buildSupabaseThumbnailUrl(uri, { width, quality }), [uri, width, quality]);
  const [state, setState] = useState({ uri, useOriginal: thumbnailUri === null });

  // Reset the fallback chain when the source changes (React "adjust state on render" pattern).
  if (state.uri !== uri) {
    setState({ uri, useOriginal: thumbnailUri === null });
  }

  const showOriginal = state.useOriginal || thumbnailUri === null;
  const source = { uri: showOriginal ? uri : thumbnailUri };

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (!showOriginal) {
          setState({ uri, useOriginal: true });
          return;
        }

        onFinalError?.();
      }}
    />
  );
}
