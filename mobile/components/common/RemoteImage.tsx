import { useMemo, useState } from 'react';
import type { StyleProp } from 'react-native';
import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
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

const CONTENT_FIT: Record<NonNullable<RemoteImageProps['resizeMode']>, ImageContentFit> = {
  cover: 'cover',
  contain: 'contain',
  center: 'none',
  stretch: 'fill',
};

/**
 * Loads a Supabase-hosted image as a resized thumbnail, falling back to the
 * original URL if the transformation endpoint is unavailable, and finally
 * signalling `onFinalError` so callers can render their own placeholder.
 *
 * Rendimiento: usa expo-image con caché en memoria+disco, así que una imagen ya
 * vista se pinta al instante sin volver a descargarse; el `transition` añade un
 * fundido suave que disimula la latencia de la primera carga.
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
  const source = showOriginal ? uri : (thumbnailUri as string);

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      source={source}
      style={style}
      contentFit={CONTENT_FIT[resizeMode]}
      transition={180}
      cachePolicy="memory-disk"
      recyclingKey={uri}
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
