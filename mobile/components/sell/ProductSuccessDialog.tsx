import { AlertSheet } from '../common/AlertSheet';

type ProductSuccessDialogProps = {
  description: string;
  title: string;
  visible: boolean;
  onExploreProducts: () => void;
  onPublishAnother: () => void;
};

export function ProductSuccessDialog({
  description,
  title,
  visible,
  onExploreProducts,
  onPublishAnother,
}: ProductSuccessDialogProps) {
  return (
    <AlertSheet
      actions={[
        { icon: 'compass-outline', label: 'Explorar productos', onPress: onExploreProducts },
        { icon: 'add-circle-outline', label: 'Publicar otro', variant: 'secondary', onPress: onPublishAnother },
      ]}
      description={description}
      title={title}
      tone="success"
      visible={visible}
      onRequestClose={onPublishAnother}
    />
  );
}
