import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabaseClient';

const AVATAR_BUCKET = 'avatars';

export async function pickProfileAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permite el acceso a tus fotos para cambiar tu imagen de perfil.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ['images'],
    quality: 0.82,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return result.assets[0];
}

export async function uploadProfileAvatar(profileId: string, asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = getFileExtension(mimeType, asset.uri);
  const path = `${profileId}/avatar-${Date.now()}.${extension}`;
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, arrayBuffer, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw toPublicStorageError(error);
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteProfileAvatar(avatarUrl: string | null): Promise<void> {
  const path = getAvatarPathFromPublicUrl(avatarUrl);

  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);

  if (error) {
    throw toPublicStorageError(error);
  }
}

function toPublicStorageError(error: { message?: string; statusCode?: string | number }): Error {
  const message = (error.message ?? '').toLowerCase();

  if (message.includes('bucket') || message.includes('not found')) {
    return new Error('El almacenamiento de fotos no esta listo. Crea el bucket avatars en Supabase.');
  }

  if (message.includes('row-level security') || message.includes('permission') || message.includes('policy')) {
    return new Error('Faltan permisos para guardar fotos. Revisa las politicas del bucket avatars.');
  }

  if (String(error.statusCode ?? '') === '400') {
    return new Error('No pudimos procesar la imagen. Prueba con otra foto.');
  }

  return new Error('No pudimos subir tu foto. Intenta nuevamente.');
}

function getFileExtension(mimeType: string, uri: string): string {
  if (mimeType.includes('png')) {
    return 'png';
  }

  if (mimeType.includes('webp')) {
    return 'webp';
  }

  const uriExtension = uri.split('.').pop()?.split('?')[0]?.toLowerCase();

  if (uriExtension === 'png' || uriExtension === 'webp' || uriExtension === 'jpg' || uriExtension === 'jpeg') {
    return uriExtension === 'jpeg' ? 'jpg' : uriExtension;
  }

  return 'jpg';
}

function getAvatarPathFromPublicUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const markerIndex = avatarUrl.indexOf(marker);

  if (markerIndex < 0) {
    return null;
  }

  return decodeURIComponent(avatarUrl.slice(markerIndex + marker.length));
}
