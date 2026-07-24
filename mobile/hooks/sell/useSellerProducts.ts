import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type StoreResource,
} from '../../services/marketplaceApi';
import { pickProductImage, takeProductImage, uploadProductImage } from '../../services/productImageService';
import { initialProductForm } from '../../constants/sell';
import type { CachedSellerState, ProductForm, SellerCenterState } from '../../types/sell';
import type { Product } from '../../types/marketplace';
import type { StatusTone } from '../../types/status';

type UseSellerProductsParams = {
  accessToken: string | null;
  store: StoreResource | null;
  canCreateProducts: boolean;
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  setSellerState: Dispatch<SetStateAction<SellerCenterState | null>>;
  saveSellerState: (state: CachedSellerState) => void;
  notify: (message: string, tone?: StatusTone) => void;
  onExploreProducts: () => void;
};

/**
 * Toda la lógica de productos del vendedor: el formulario, crear, editar,
 * eliminar y elegir imágenes. Vive aparte de SellScreen para que la pantalla
 * sea un orquestador delgado y no un monolito, y para poder mover el flujo de
 * publicar / editar entre secciones sin arrastrar 250 líneas de handlers.
 */
export function useSellerProducts({
  accessToken,
  store,
  canCreateProducts,
  products,
  setProducts,
  setSellerState,
  saveSellerState,
  notify,
  onExploreProducts,
}: UseSellerProductsParams) {
  const [productForm, setProductForm] = useState<ProductForm>(initialProductForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSuccess, setProductSuccess] = useState<{ title: string; description: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetProductForm = useCallback(() => {
    setProductForm({ ...initialProductForm, image: null });
  }, []);

  /** Valida el formulario y devuelve los campos ya normalizados, o null si algo falla. */
  const validateForm = useCallback((): { name: string; description: string; price: number; stock: number } | null => {
    const name = productForm.name.trim();
    const description = productForm.description.trim();
    const price = Number(productForm.price.replace(',', '.'));
    const stock = Number(productForm.stock);

    if (name.length < 3) {
      notify('Ingresa un titulo de producto valido.', 'warning');
      return null;
    }

    if (description.length < 10) {
      notify('Ingresa una descripcion de al menos 10 caracteres.', 'warning');
      return null;
    }

    if (!productForm.categoryId) {
      notify('Selecciona una categoria para el producto.', 'warning');
      return null;
    }

    if (!Number.isFinite(price) || price <= 0 || price > 9999999.99) {
      notify('Ingresa un precio valido mayor a cero.', 'warning');
      return null;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      notify('Ingresa una cantidad disponible valida.', 'warning');
      return null;
    }

    return { name, description, price, stock };
  }, [notify, productForm]);

  const handleCreateProduct = useCallback(async () => {
    if (!accessToken || !canCreateProducts || !store) {
      return;
    }

    const valid = validateForm();

    if (!valid) {
      return;
    }

    if (!productForm.image) {
      notify('Agrega una imagen del producto desde la camara o galeria.', 'warning');
      return;
    }

    setIsSaving(true);
    const shouldPublish = productForm.publishNow;

    try {
      const imageUrl = await uploadProductImage(store.id, productForm.image);
      const nextProduct = await createProduct(accessToken, {
        category_id: productForm.categoryId,
        name: valid.name,
        description: valid.description,
        images: [{ url: imageUrl, alt_text: valid.name }],
        price_cents: Math.round(valid.price * 100),
        stock: valid.stock,
        status: shouldPublish ? 'active' : 'draft',
      });

      setProducts((current) => {
        const nextProducts = [nextProduct, ...current];
        const nextState: SellerCenterState = nextProducts.length > 0 ? 'catalog_ready' : 'catalog_required';

        setSellerState(nextState);
        saveSellerState({ sellerState: nextState, store, products: nextProducts });

        return nextProducts;
      });

      resetProductForm();
      setProductSuccess({
        title: shouldPublish
          ? 'Tu producto ha sido publicado correctamente'
          : 'Tu producto ha sido guardado correctamente',
        description: shouldPublish
          ? 'Ya esta listo para aparecer en el catalogo de nexo.'
          : 'Quedo como borrador en tu centro de ventas.',
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo crear el producto.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, canCreateProducts, notify, productForm, resetProductForm, saveSellerState, setProducts, setSellerState, store, validateForm]);

  const handleStartEdit = useCallback((product: Product) => {
    setProductForm({
      categoryId: product.categoryId ?? '',
      name: product.title,
      description: product.description,
      image: null,
      price: (product.priceCents / 100).toFixed(2),
      publishNow: product.status === 'active',
      stock: String(product.stock),
    });
    setEditingProduct(product);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingProduct(null);
    resetProductForm();
  }, [resetProductForm]);

  const handleUpdateProduct = useCallback(async () => {
    if (!accessToken || !editingProduct) {
      return;
    }

    const valid = validateForm();

    if (!valid) {
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl: string | undefined;

      if (productForm.image && store) {
        imageUrl = await uploadProductImage(store.id, productForm.image);
      }

      const payload: Parameters<typeof updateProduct>[2] = {
        category_id: productForm.categoryId || null,
        name: valid.name,
        description: valid.description,
        price_cents: Math.round(valid.price * 100),
        stock: valid.stock,
        status: productForm.publishNow ? 'active' : 'draft',
      };

      if (imageUrl) {
        payload.images = [{ url: imageUrl, alt_text: valid.name }];
      }

      const updated = await updateProduct(accessToken, editingProduct.slug, payload);

      setProducts((current) => current.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProduct(null);
      resetProductForm();
      notify('Producto actualizado.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo actualizar el producto.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, editingProduct, notify, productForm, resetProductForm, setProducts, store, validateForm]);

  const handleDeleteProduct = useCallback(async (product: Product) => {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);

    try {
      await deleteProduct(accessToken, product.slug);
      setProducts((current) => {
        const next = current.filter((p) => p.id !== product.id);
        const nextState: SellerCenterState = next.length > 0 ? 'catalog_ready' : 'catalog_required';

        setSellerState(nextState);

        if (store) {
          saveSellerState({ sellerState: nextState, store, products: next });
        }

        return next;
      });
      notify('Producto eliminado.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo eliminar el producto.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, notify, saveSellerState, setProducts, setSellerState, store]);

  const handlePickImage = useCallback(async () => {
    try {
      const image = await pickProductImage();

      if (image) {
        setProductForm((current) => ({ ...current, image }));
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No pudimos seleccionar la imagen.', 'error');
    }
  }, [notify]);

  const handleTakeImage = useCallback(async () => {
    try {
      const image = await takeProductImage();

      if (image) {
        setProductForm((current) => ({ ...current, image }));
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No pudimos tomar la foto.', 'error');
    }
  }, [notify]);

  const dismissSuccessAndExplore = useCallback(() => {
    setProductSuccess(null);
    onExploreProducts();
  }, [onExploreProducts]);

  const dismissSuccessAndPublishAnother = useCallback(() => {
    setProductSuccess(null);
    resetProductForm();
  }, [resetProductForm]);

  return {
    productForm,
    setProductForm,
    editingProduct,
    productSuccess,
    isSaving,
    resetProductForm,
    handleCreateProduct,
    handleStartEdit,
    handleCancelEdit,
    handleUpdateProduct,
    handleDeleteProduct,
    handlePickImage,
    handleTakeImage,
    dismissSuccessAndExplore,
    dismissSuccessAndPublishAnother,
  };
}
