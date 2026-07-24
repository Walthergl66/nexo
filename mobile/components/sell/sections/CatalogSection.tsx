import { EditProductModal } from '../EditProductModal';
import { SellerProductList } from '../SellerProductList';
import type { useSellCategories } from '../../../hooks/sell/useSellCategories';
import type { useSellerProducts } from '../../../hooks/sell/useSellerProducts';
import type { Product } from '../../../types/marketplace';

type CatalogSectionProps = {
  productCtl: ReturnType<typeof useSellerProducts>;
  categories: ReturnType<typeof useSellCategories>;
  products: Product[];
  isListLoading: boolean;
  /** Solo un vendedor con tienda activa puede editar/eliminar. */
  canManage: boolean;
};

/**
 * Sección "Mis productos": lista de publicaciones con acciones de editar
 * (precio, stock, imagen…) y eliminar, más el modal de edición.
 */
export function CatalogSection({ productCtl, categories, products, isListLoading, canManage }: CatalogSectionProps) {
  return (
    <>
      <SellerProductList
        products={products}
        isLoading={isListLoading}
        onEdit={canManage ? productCtl.handleStartEdit : undefined}
        onDelete={canManage ? productCtl.handleDeleteProduct : undefined}
      />
      <EditProductModal
        visible={productCtl.editingProduct !== null}
        categories={categories.categories}
        categoryError={categories.categoryError}
        form={productCtl.productForm}
        existingImageUrl={productCtl.editingProduct?.imageUrl ?? null}
        isCategoriesLoading={categories.isCategoriesLoading}
        isSaving={productCtl.isSaving}
        onChange={productCtl.setProductForm}
        onSubmit={productCtl.handleUpdateProduct}
        onCancel={productCtl.handleCancelEdit}
        onPickImage={productCtl.handlePickImage}
        onTakeImage={productCtl.handleTakeImage}
        onRefreshCategories={categories.refreshCategories}
      />
    </>
  );
}
