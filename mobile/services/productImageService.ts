import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabaseClient';

const PRODUCT_IMAGES_BUCKET = 'product-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type ProductImageAsset = ImagePicker.ImagePickerAsset;

export async function pickProductImage(): Promise<ProductImageAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permite el acceso a tus fotos para subir una imagen del producto.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
    mediaTypes: ['images'],
    quality: 0.86,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  validateProductImage(result.assets[0]);

  return result.assets[0];
}

export async function takeProductImage(): Promise<ProductImageAsset | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permite el acceso a la camara para tomar una foto del producto.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    mediaTypes: ['images'],
    quality: 0.86,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  validateProductImage(result.assets[0]);

  return result.assets[0];
}

export async function uploadProductImage(storeId: string, asset: ProductImageAsset): Promise<string> {
  validateProductImage(asset);

  const mimeType = normalizeMimeType(asset.mimeType, asset.uri);
  const extension = getFileExtension(mimeType, asset.uri);
  const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('La imagen debe pesar menos de 5 MB.');
  }

  const fileBody = new Blob([arrayBuffer], { type: mimeType });
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, fileBody, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw toPublicStorageError(error);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

function validateProductImage(asset: ProductImageAsset): void {
  const mimeType = normalizeMimeType(asset.mimeType, asset.uri);

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('La imagen debe ser JPG, PNG o WebP.');
  }

  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    throw new Error('La imagen debe pesar menos de 5 MB.');
  }
}

function toPublicStorageError(error: { message?: string; statusCode?: string | number }): Error {
  const message = (error.message ?? '').toLowerCase();

  if (message.includes('bucket') || message.includes('not found')) {
    return new Error('El almacenamiento de productos no esta listo. Crea el bucket product-images en Supabase.');
  }

  if (
    message.includes('row-level security')
    || message.includes('permission')
    || message.includes('policy')
    || message.includes('unauthorized')
    || message.includes('violates')
  ) {
    return new Error('Faltan permisos para guardar imagenes de productos. Revisa las politicas del bucket product-images.');
  }

  if (message.includes('mime') || message.includes('content type')) {
    return new Error('El bucket product-images debe permitir imagenes JPG, PNG o WebP.');
  }

  if (String(error.statusCode ?? '') === '400') {
    return new Error(
      error.message
        ? `Supabase no acepto la imagen: ${error.message}`
        : 'Supabase no acepto la imagen. Revisa el bucket product-images y sus politicas.',
    );
  }

  return new Error('No pudimos subir la imagen del producto. Intenta nuevamente.');
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
