import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';
import type { StoreLogoSize } from '../types/sell';

const STORE_LOGOS_BUCKET = 'store-images';
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const LOGO_SIZE_WIDTHS: Record<StoreLogoSize, number> = {
  small: 384,
  medium: 768,
  large: 1200,
};

export type StoreLogoAsset = ImagePicker.ImagePickerAsset;

export async function pickStoreLogo(): Promise<StoreLogoAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permite el acceso a tus fotos para agregar la imagen de tu tienda.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ['images'],
    quality: 0.86,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  validateStoreLogo(result.assets[0]);

  return result.assets[0];
}

export async function takeStoreLogo(): Promise<StoreLogoAsset | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permite el acceso a la camara para tomar la imagen de tu tienda.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ['images'],
    quality: 0.86,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  validateStoreLogo(result.assets[0]);

  return result.assets[0];
}

export async function uploadStoreLogo(asset: StoreLogoAsset, size: StoreLogoSize): Promise<string> {
  validateStoreLogo(asset);

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error('Inicia sesion nuevamente para subir la imagen de tu tienda.');
  }

  const preparedLogo = await resizeStoreLogo(asset, size);
  const mimeType = normalizeMimeType(preparedLogo.mimeType, preparedLogo.uri);
  const extension = getFileExtension(mimeType, preparedLogo.uri);
  const path = `${userData.user.id}/logo-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const response = await fetch(preparedLogo.uri);
  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_LOGO_BYTES) {
    throw new Error('La imagen de la tienda debe pesar menos de 5 MB.');
  }

  const fileBody = Platform.OS === 'web'
    ? await responseToBlob(response, arrayBuffer, mimeType)
    : arrayBuffer;
  const { error } = await supabase.storage
    .from(STORE_LOGOS_BUCKET)
    .upload(path, fileBody, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw toPublicStorageError(error);
  }

  const { data } = supabase.storage.from(STORE_LOGOS_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

async function resizeStoreLogo(asset: StoreLogoAsset, size: StoreLogoSize): Promise<{ mimeType: string; uri: string }> {
  const mimeType = normalizeMimeType(asset.mimeType, asset.uri);
  const width = LOGO_SIZE_WIDTHS[size];
  const result = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width } }],
    {
      compress: size === 'large' ? 0.9 : 0.86,
      format: imageManipulatorFormat(mimeType),
    },
  );

  return {
    mimeType,
    uri: result.uri,
  };
}

async function responseToBlob(response: Response, arrayBuffer: ArrayBuffer, mimeType: string): Promise<Blob> {
  try {
    return await response.blob();
  } catch {
    return new Blob([arrayBuffer], { type: mimeType });
  }
}

function validateStoreLogo(asset: StoreLogoAsset): void {
  const mimeType = normalizeMimeType(asset.mimeType, asset.uri);

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('La imagen de la tienda debe ser JPG, PNG o WebP.');
  }

  if (asset.fileSize && asset.fileSize > MAX_LOGO_BYTES) {
    throw new Error('La imagen de la tienda debe pesar menos de 5 MB.');
  }
}

function toPublicStorageError(error: { message?: string; statusCode?: string | number }): Error {
  const message = (error.message ?? '').toLowerCase();

  if (message.includes('bucket') || message.includes('not found')) {
    return new Error('El almacenamiento de imagenes no esta listo. Revisa el bucket store-images en Supabase.');
  }

  if (
    message.includes('row-level security')
    || message.includes('permission')
    || message.includes('policy')
    || message.includes('unauthorized')
    || message.includes('violates')
  ) {
    return new Error('Faltan permisos para guardar la imagen de la tienda. Revisa las politicas del bucket store-images.');
  }

  if (message.includes('mime') || message.includes('content type')) {
    return new Error('El bucket store-images debe permitir imagenes JPG, PNG o WebP.');
  }

  if (String(error.statusCode ?? '') === '400') {
    return new Error(
      error.message
        ? `Supabase no acepto la imagen: ${error.message}`
        : 'Supabase no acepto la imagen de la tienda.',
    );
  }

  return new Error('No pudimos subir la imagen de la tienda. Intenta nuevamente.');
}

function normalizeMimeType(mimeType: string | undefined, uri: string): string {
  if (mimeType && ALLOWED_MIME_TYPES.includes(mimeType)) {
    return mimeType;
  }

  const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase();

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function getFileExtension(mimeType: string, uri: string): string {
  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase();

  return extension === 'jpeg' ? 'jpg' : extension === 'jpg' ? 'jpg' : 'jpg';
}

function imageManipulatorFormat(mimeType: string): ImageManipulator.SaveFormat {
  if (mimeType === 'image/png') {
    return ImageManipulator.SaveFormat.PNG;
  }

  if (mimeType === 'image/webp') {
    return ImageManipulator.SaveFormat.WEBP;
  }

  return ImageManipulator.SaveFormat.JPEG;
}
