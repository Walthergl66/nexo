import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { ProductCard } from '../cards/ProductCard';
import { SellerProductCard } from '../cards/SellerProductCard';
import { Tag } from '../common/Tag';
import { useFavorites } from '../../context/FavoritesContext';
import type { ProfileResource } from '../../services/marketplaceApi';
import type { Product } from '../../types/marketplace';
import { colors } from '../../theme/colors';
import { accountStyles as styles } from './accountStyles';

type AuthenticatedAccountPanelProps = {
  isLoggingOut: boolean;
  products: Product[];
  profile: ProfileResource;
  catalogProducts: Product[];
  isAuthenticated: boolean;
  onAddToCart: (product: Product) => void | Promise<boolean>;
  onOpenProduct: (product: Product) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onSell: () => void;
};

export function AuthenticatedAccountPanel({
  isLoggingOut,
  products,
  profile,
  catalogProducts,
  isAuthenticated,
  onAddToCart,
  onOpenProduct,
  onLogout,
  onOpenSettings,
  onSell,
}: AuthenticatedAccountPanelProps) {
  const canRequestSellerVerification = profile.role === 'buyer' && profile.verification_status !== 'suspended';
  const initials = useMemo(() => getInitials(profile), [profile]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const roleLabel = getRoleLabel(profile.role);
  const statusLabel = getVerificationLabel(profile.verification_status);
  const publishedProducts = products.filter((product) => product.available);
  const { isFavorite } = useFavorites();
  const favoriteProducts = useMemo(
    () => catalogProducts.filter((product) => isFavorite(product.id)),
    [catalogProducts, isFavorite],
  );

  const handleOpenSettings = () => {
    setIsProfileMenuOpen(false);
    onOpenSettings();
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    onLogout();
  };

  return (
    <>
      <View style={styles.profilePage}>
        <View style={styles.socialHeader}>
          <View style={styles.socialAvatarWrap}>
            <View style={styles.socialAvatar}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.profileAvatarText}>{initials}</Text>
              )}
            </View>
            {profile.verification_status === 'approved' && (
              <View style={styles.socialAvatarBadge}>
                <Ionicons name="checkmark" size={14} color={colors.surface} />
              </View>
            )}
          </View>

          <View style={styles.socialStats}>
            <ProfileStat label="Productos" value={String(products.length)} />
            <ProfileStat label="activos" value={String(publishedProducts.length)} />
            <ProfileStat label="ventas" value="0" />
          </View>

          <View style={styles.profileHeaderActions}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.profilePencilButton, pressed && styles.buttonPressed]}
              onPress={() => setIsProfileMenuOpen((current) => !current)}
            >
              <Ionicons name="settings-outline" size={20} color={colors.ink} />
            </Pressable>
            {isProfileMenuOpen && (
              <View style={styles.profileOptionsMenu}>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.profileOptionItem, pressed && styles.profileOptionItemPressed]}
                  onPress={handleOpenSettings}
                >
                  <Ionicons name="create-outline" size={17} color={colors.ink} />
                  <Text style={styles.profileOptionText}>Editar perfil</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isLoggingOut}
                  style={({ pressed }) => [
                    styles.profileOptionItem,
                    pressed && styles.profileOptionItemPressed,
                    isLoggingOut && styles.buttonDisabled,
                  ]}
                  onPress={handleLogout}
                >
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color="#9f1239" />
                  ) : (
                    <Ionicons name="log-out-outline" size={17} color="#9f1239" />
                  )}
                  <Text style={styles.profileOptionTextDanger}>Cerrar sesion</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <View style={styles.socialBio}>
          <Text style={styles.accountName}>{profile.display_name ?? profile.email ?? 'Usuario nexo'}</Text>
        </View>

        <View style={styles.profileImportantStrip}>
          <ImportantInfo icon="mail-outline" label={profile.email ?? 'Correo no registrado'} />
          <ImportantInfo icon="call-outline" label={profile.phone ?? 'Telefono no registrado'} />
        </View>

        <View style={styles.profileActionRow}>
          
          {canRequestSellerVerification ? (
            <Pressable style={({ pressed }) => [styles.profileActionButton, pressed && styles.buttonPressed]} onPress={onSell}>
              <Text style={styles.profileActionText}>Vender</Text>
            </Pressable>
          ) : (
            <Pressable style={({ pressed }) => [styles.profileActionButton, pressed && styles.buttonPressed]} onPress={onSell}>
              <Text style={styles.profileActionText}>Centro de ventas</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.profileHighlights}>
          <Highlight icon="receipt-outline" label="Pedidos" />
          <Highlight
            icon={showFavorites ? 'heart' : 'heart-outline'}
            label="Favoritos"
            badge={favoriteProducts.length}
            active={showFavorites}
            onPress={() => setShowFavorites((current) => !current)}
          />
        </View>

        {showFavorites ? (
          favoriteProducts.length > 0 ? (
            <View style={styles.postGrid}>
              {favoriteProducts.map((product) => (
                <View key={product.id} style={styles.postCell}>
                  <ProductCard
                    product={product}
                    isAuthenticated={isAuthenticated}
                    isOwn={Boolean(product.ownerProfileId) && product.ownerProfileId === profile.id}
                    onAddToCart={() => onAddToCart(product)}
                    onSelectProduct={() => onOpenProduct(product)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPosts}>
              <Ionicons name="heart-outline" size={28} color={colors.brandBlue} />
              <Text style={styles.emptyPostsTitle}>Sin favoritos</Text>
              <Text style={styles.emptyPostsText}>
                Toca el corazon en cualquier producto del catalogo para guardarlo aqui.
              </Text>
            </View>
          )
        ) : (
          <>
            <View style={styles.profileTabs}>
              <View style={styles.profileTabActive}>
                <Ionicons name="grid" size={22} color={colors.ink} />
              </View>
              <View style={styles.profileTab}>
                <Ionicons name="person-circle-outline" size={24} color={colors.inkSoft} />
              </View>
            </View>

            {products.length > 0 ? (
              <View style={styles.postGrid}>
                {products.map((product) => (
                  <View key={product.id} style={styles.postCell}>
                    <SellerProductCard product={product} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyPosts}>
                <Ionicons name="grid-outline" size={28} color={colors.brandBlue} />
                <Text style={styles.emptyPostsTitle}>Sin publicaciones</Text>
                <Text style={styles.emptyPostsText}>
                  Los productos publicados apareceran aqui como el catalogo visible del perfil.
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </>
  );
}

type AccountSettingsPanelProps = {
  isSavingProfile: boolean;
  profile: ProfileResource;
  onBack: () => void;
  onChangeAvatar: () => Promise<void>;
  onDeleteAvatar: () => Promise<void>;
  onLogout: () => void;
  onUpdateProfile: (payload: { address: string; phone: string }) => Promise<void>;
};

export function AccountSettingsPanel({
  isSavingProfile,
  profile,
  onBack,
  onChangeAvatar,
  onDeleteAvatar,
  onLogout,
  onUpdateProfile,
}: AccountSettingsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState(profile.address ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const roleLabel = getRoleLabel(profile.role);
  const statusLabel = getVerificationLabel(profile.verification_status);

  useEffect(() => {
    setAddress(profile.address ?? '');
    setPhone(profile.phone ?? '');
  }, [profile.address, profile.phone]);

  const handleCancel = () => {
    setAddress(profile.address ?? '');
    setPhone(profile.phone ?? '');
    setFormError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const nextPhone = phone.replace(/\D+/g, '').slice(0, 10);
    const nextAddress = address.trim();

    if (nextAddress.length < 5) {
      setFormError('Ingresa una direccion mas completa.');
      return;
    }

    if (!/^09\d{8}$/.test(nextPhone)) {
      setFormError('Ingresa un telefono celular valido.');
      return;
    }

    setFormError(null);
    await onUpdateProfile({ address: nextAddress, phone: nextPhone });
    setIsEditing(false);
  };

  return (
    <>
      <View style={styles.profileShell}>
        <View style={styles.settingsTopbar}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.profilePencilButton, pressed && styles.buttonPressed]}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={21} color={colors.ink} />
          </Pressable>
          <View style={styles.settingsTitleWrap}>
            <Text style={styles.settingsTitle}>Configuracion</Text>
            <Text style={styles.accountEmail}>{profile.email ?? 'Correo no registrado'}</Text>
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarSettingsRow}>
            <View style={styles.settingsAvatar}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.profileAvatarText}>{getInitials(profile)}</Text>
              )}
            </View>
            <View style={styles.avatarSettingsContent}>
              <Text style={styles.profileSectionTitle}>Foto de perfil</Text>
              <Text style={styles.profileSectionHint}>Esta imagen se mostrara en tu perfil y publicaciones.</Text>
              <View style={styles.avatarButtonRow}>
                <Pressable
                  disabled={isSavingProfile}
                  style={({ pressed }) => [styles.avatarActionButton, pressed && styles.buttonPressed, isSavingProfile && styles.buttonDisabled]}
                  onPress={onChangeAvatar}
                >
                  <Ionicons name="camera-outline" size={16} color={colors.brandBlue} />
                  <Text style={styles.avatarActionText}>{profile.avatar_url ? 'Cambiar' : 'Subir'}</Text>
                </Pressable>
                {profile.avatar_url && (
                  <Pressable
                    disabled={isSavingProfile}
                    style={({ pressed }) => [styles.avatarActionButtonDanger, pressed && styles.buttonPressed, isSavingProfile && styles.buttonDisabled]}
                    onPress={onDeleteAvatar}
                  >
                    <Ionicons name="trash-outline" size={16} color="#9f1239" />
                    <Text style={styles.avatarActionTextDanger}>Eliminar</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileSectionTitleRow}>
            <View>
              <Text style={styles.profileSectionTitle}>Datos personales</Text>
              <Text style={styles.profileSectionHint}>Informacion usada para validar tu cuenta.</Text>
            </View>
            <Ionicons name="lock-closed" size={16} color={colors.inkSoft} />
          </View>
          <View style={styles.profileFieldGrid}>
            <ProfileInfo label="Cedula" value={profile.national_id} />
            <ProfileInfo label="Nombres" value={profile.first_name} />
            <ProfileInfo label="Apellidos" value={profile.last_name} />
            <ProfileInfo label="Edad" value={profile.age === null ? null : String(profile.age)} />
            <ProfileInfo label="Genero" value={profile.gender} />
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileSectionTitleRow}>
            <View>
              <Text style={styles.profileSectionTitle}>Contacto y entregas</Text>
              <Text style={styles.profileSectionHint}>Puedes actualizar estos datos cuando cambien.</Text>
            </View>
            {!isEditing && (
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.iconActionButton, pressed && styles.buttonPressed]}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={18} color={colors.brandBlue} />
              </Pressable>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editProfileForm}>
              <View style={styles.fieldWrapFull}>
                <Text style={styles.inputLabel}>Direccion</Text>
                <TextInput
                  multiline
                  placeholder="Calle, numero, referencia"
                  placeholderTextColor={colors.inkSoft}
                  style={[styles.input, styles.multilineInput]}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              <View style={styles.fieldWrapFull}>
                <Text style={styles.inputLabel}>Telefono</Text>
                <TextInput
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="09XXXXXXXX"
                  placeholderTextColor={colors.inkSoft}
                  style={styles.input}
                  value={phone}
                  onChangeText={(value) => setPhone(value.replace(/\D+/g, '').slice(0, 10))}
                />
              </View>
              {formError && <Text style={styles.errorText}>{formError}</Text>}
              <View style={styles.profileActionRow}>
                <Pressable
                  disabled={isSavingProfile}
                  style={({ pressed }) => [styles.secondaryButtonCompact, pressed && styles.buttonPressed, isSavingProfile && styles.buttonDisabled]}
                  onPress={handleCancel}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  disabled={isSavingProfile}
                  style={({ pressed }) => [styles.primaryButtonCompact, pressed && styles.buttonPressed, isSavingProfile && styles.buttonDisabled]}
                  onPress={handleSave}
                >
                  {isSavingProfile ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={17} color={colors.surface} />
                      <Text style={styles.primaryButtonText}>Guardar</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.profileFieldGrid}>
              <ProfileInfo label="Direccion" value={profile.address} />
              <ProfileInfo label="Telefono" value={profile.phone} />
            </View>
          )}
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>Estado de cuenta</Text>
          <View style={styles.profileMetricRow}>
            <View style={styles.profileMetric}>
              <Ionicons name="person-outline" size={18} color={colors.brandBlue} />
              <View>
                <Text style={styles.metricLabel}>Rol</Text>
                <Text style={styles.metricValue}>{roleLabel}</Text>
              </View>
            </View>
            <View style={styles.profileMetric}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.brandBlue} />
              <View>
                <Text style={styles.metricLabel}>Verificacion</Text>
                <Text style={styles.metricValue}>{statusLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={onLogout}>
          <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
        </Pressable>
      </View>
    </>
  );
}

function ProfileStat({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <View style={styles.profileStat}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.profileStatValue, compact && styles.profileStatValueCompact]}>
        {value}
      </Text>
      <Text style={styles.profileStatLabel}>{label}</Text>
    </View>
  );
}

function ImportantInfo({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.importantInfoRow}>
      <Ionicons name={icon} size={16} color={colors.brandBlue} />
      <Text numberOfLines={1} style={styles.importantInfoText}>{label}</Text>
    </View>
  );
}

function Highlight({
  icon,
  label,
  badge,
  active = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  active?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.highlightCircle}>
        <Ionicons name={icon} size={20} color={colors.brandBlue} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.highlightBadge}>
            <Text style={styles.highlightBadgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={styles.highlightLabel}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.highlightItem}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.highlightItem,
        active && styles.highlightItemActive,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

function ProfileInfo({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.profileInfoItem}>
      <Text style={styles.profileInfoLabel}>{label}</Text>
      <Text style={styles.profileInfoValue}>{value && value.trim().length > 0 ? value : 'No registrado'}</Text>
    </View>
  );
}

function getInitials(profile: ProfileResource) {
  const source = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.display_name || profile.email || 'N';

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getRoleLabel(role: string) {
  if (role === 'seller') {
    return 'Vendedor';
  }

  if (role === 'admin') {
    return 'Administrador';
  }

  return 'Comprador';
}

function getVerificationLabel(status: string) {
  if (status === 'approved') {
    return 'Verificado';
  }

  if (status === 'suspended') {
    return 'Suspendido';
  }

  if (status === 'rejected') {
    return 'Rechazado';
  }

  return 'Pendiente';
}
