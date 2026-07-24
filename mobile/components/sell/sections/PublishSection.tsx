import { ProductCreateForm } from '../ProductCreateForm';
import { ProductSuccessDialog } from '../ProductSuccessDialog';
import type { useSellCategories } from '../../../hooks/sell/useSellCategories';
import type { useSellerProducts } from '../../../hooks/sell/useSellerProducts';

type PublishSectionProps = {
  productCtl: ReturnType<typeof useSellerProducts>;
  categories: ReturnType<typeof useSellCategories>;
};

/** Sección "Publicar": el formulario para crear un producto y su diálogo de éxito. */
export function PublishSection({ productCtl, categories }: PublishSectionProps) {
  return (
    <>
      <ProductSuccessDialog
        visible={productCtl.productSuccess !== null}
        title={productCtl.productSuccess?.title ?? ''}
        description={productCtl.productSuccess?.description ?? ''}
        onExploreProducts={productCtl.dismissSuccessAndExplore}
        onPublishAnother={productCtl.dismissSuccessAndPublishAnother}
      />
      <ProductCreateForm
        categories={categories.categories}
        categoryError={categories.categoryError}
        form={productCtl.productForm}
        isCategoriesLoading={categories.isCategoriesLoading}
        isLoading={productCtl.isSaving}
        onChange={productCtl.setProductForm}
        onCreateProduct={productCtl.handleCreateProduct}
        onPickImage={productCtl.handlePickImage}
        onRefreshCategories={categories.refreshCategories}
        onTakeImage={productCtl.handleTakeImage}
      />
    </>
  );
}
