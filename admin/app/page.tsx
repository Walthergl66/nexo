'use client';

import {
  AlertTriangle,
  Ban,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Trash2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  Store as StoreIcon,
  Users,
  XCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createCategory,
  deleteStore,
  fetchCategories,
  fetchAdminStores,
  fetchMe,
  fetchProducts,
  fetchSellerVerificationRequests,
  reviewSellerVerificationRequest,
  updateCategory,
  updateStoreStatus,
} from '@/lib/api';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import type { Category, Product, Profile, ReviewStatus, SellerVerificationRequest, Store } from '@/lib/types';

type Section = 'dashboard' | 'requests' | 'publications' | 'stores' | 'categories' | 'users';

const navItems: Array<{ id: Section; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'requests', label: 'Solicitudes', icon: ClipboardCheck },
  { id: 'publications', label: 'Publicaciones', icon: PackageSearch },
  { id: 'stores', label: 'Tiendas', icon: StoreIcon },
  { id: 'categories', label: 'Categorias', icon: FolderTree },
  { id: 'users', label: 'Usuarios', icon: Users },
];

const statusLabels: Record<string, string> = {
  active: 'Activo',
  approved: 'Aprobado',
  draft: 'Borrador',
  inactive: 'Inactivo',
  paused: 'Pausado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
  suspended: 'Suspendido',
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<SellerVerificationRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const loadAdminData = useCallback(async (accessToken: string) => {
    const currentProfile = await fetchMe(accessToken);

    if (currentProfile.role !== 'admin') {
      await supabase.auth.signOut();
      setToken(null);
      setProfile(null);
      throw new Error('Tu cuenta no tiene permisos de administrador.');
    }

    const [verificationRequests, categoryRows, productRows, storeRows] = await Promise.all([
      fetchSellerVerificationRequests(accessToken),
      fetchCategories(),
      fetchProducts(),
      fetchAdminStores(accessToken),
    ]);

    setProfile(currentProfile);
    setRequests(verificationRequests);
    setCategories(categoryRows);
    setProducts(productRows);
    setStores(storeRows);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);
      setError(null);

      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;

      if (!mounted) {
        return;
      }

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(accessToken);
        await loadAdminData(accessToken);
      } catch (caughtError) {
        setError(toErrorMessage(caughtError));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadAdminData]);

  const metrics = useMemo(
    () => ({
      pendingRequests: requests.filter((item) => item.status === 'pending').length,
      activeStores: stores.filter((store) => store.status === 'active').length,
      activeProducts: products.filter((product) => product.status === 'active').length,
      categories: categories.length,
    }),
    [categories.length, products, requests, stores],
  );

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (!hasSupabaseConfig) {
        throw new Error('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en admin/.env.local.');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        throw signInError;
      }

      const accessToken = data.session?.access_token;

      if (!accessToken) {
        throw new Error('Supabase no devolvio una sesion valida.');
      }

      setToken(accessToken);
      await loadAdminData(accessToken);
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (!token) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await loadAdminData(token);
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setToken(null);
    setProfile(null);
  }

  if (loading) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <p className="eyebrow">nexo admin</p>
          <h1>Cargando panel</h1>
          <p className="muted">Validando sesion y permisos administrativos.</p>
        </section>
      </main>
    );
  }

  if (!token || !profile) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <div className="brand">
            <div className="brand-mark">N</div>
            <div>
              <div className="brand-title">nexo admin</div>
              <div className="brand-subtitle">Operaciones y confianza</div>
            </div>
          </div>
          <p className="eyebrow">Acceso restringido</p>
          <h1>Panel administrativo</h1>
          <p className="muted">Ingresa con una cuenta de Supabase cuyo perfil interno tenga rol admin.</p>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Correo</label>
              <input
                className="input"
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contrasena</label>
              <input
                className="input"
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? <div className="error">{error}</div> : null}
            <button className="button primary" type="submit" disabled={busy}>
              <ShieldCheck size={18} />
              Entrar
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <div className="brand-title">nexo admin</div>
            <div className="brand-subtitle">Rol {profile.role}</div>
          </div>
        </div>
        <nav className="nav-list" aria-label="Secciones administrativas">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="button" type="button" onClick={handleRefresh} disabled={busy}>
            <RefreshCcw size={17} />
            Actualizar datos
          </button>
          <button className="button ghost" type="button" onClick={handleLogout}>
            <LogOut size={17} />
            Salir
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Administracion</p>
            <h1>{getSectionTitle(activeSection)}</h1>
            <p className="muted">{getSectionDescription(activeSection)}</p>
          </div>
          <div className="badge approved">{profile.email ?? profile.display_name ?? 'Admin'}</div>
        </header>

        {error ? <div className="error">{error}</div> : null}

        {activeSection === 'dashboard' ? (
          <Dashboard metrics={metrics} requests={requests} products={products} stores={stores} />
        ) : null}
        {activeSection === 'requests' ? (
          <RequestsPanel token={token} requests={requests} onError={setError} onChanged={handleRefresh} />
        ) : null}
        {activeSection === 'publications' ? <PublicationsPanel products={products} /> : null}
        {activeSection === 'stores' ? (
          <StoresPanel token={token} stores={stores} onError={setError} onChanged={handleRefresh} />
        ) : null}
        {activeSection === 'categories' ? (
          <CategoriesPanel
            token={token}
            categories={categories}
            onError={setError}
            onChanged={handleRefresh}
          />
        ) : null}
        {activeSection === 'users' ? <UsersPanel /> : null}
      </main>
    </div>
  );
}

function Dashboard({
  metrics,
  requests,
  products,
  stores,
}: {
  metrics: { pendingRequests: number; activeStores: number; activeProducts: number; categories: number };
  requests: SellerVerificationRequest[];
  products: Product[];
  stores: Store[];
}) {
  return (
    <div className="grid">
      <section className="grid metrics">
        <MetricCard label="Solicitudes pendientes" value={metrics.pendingRequests} icon={ClipboardCheck} />
        <MetricCard label="Tiendas activas" value={metrics.activeStores} icon={StoreIcon} />
        <MetricCard label="Productos activos" value={metrics.activeProducts} icon={Boxes} />
        <MetricCard label="Categorias visibles" value={metrics.categories} icon={FolderTree} />
      </section>
      <section className="split">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Solicitudes recientes</h2>
              <p className="muted">Ultimos registros de verificacion de vendedores.</p>
            </div>
          </div>
          <RequestsTable requests={requests.slice(0, 5)} compact />
        </div>
        <div className="panel">
          <h2>Riesgos operativos</h2>
          <div className="grid">
            <RiskLine label="Publicaciones fuera del flujo admin" value={products.length} />
            <RiskLine label="Tiendas suspendidas visibles al admin" value={stores.filter((s) => s.status === 'suspended').length} />
            <RiskLine label="Solicitudes rechazadas" value={requests.filter((r) => r.status === 'rejected').length} />
          </div>
        </div>
      </section>
    </div>
  );
}

function RequestsPanel({
  token,
  requests,
  onError,
  onChanged,
}: {
  token: string;
  requests: SellerVerificationRequest[];
  onError: (message: string | null) => void;
  onChanged: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  async function review(id: string, status: ReviewStatus) {
    setBusyId(id);
    onError(null);

    try {
      await reviewSellerVerificationRequest(token, id, status, reasonById[id]);
      await onChanged();
    } catch (caughtError) {
      onError(toErrorMessage(caughtError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Revision de vendedores</h2>
          <p className="muted">Aprobar convierte el perfil en seller. Rechazar o suspender retira su tienda de listados publicos.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Usuario</th>
              <th>Documento</th>
              <th>Estado</th>
              <th>Motivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.business_name}</strong>
                  <div className="muted">{request.business_description ?? 'Sin descripcion'}</div>
                </td>
                <td>
                  {request.profile?.email ?? 'Sin correo'}
                  <div className="muted">{request.profile?.display_name ?? request.profile_id}</div>
                </td>
                <td>
                  {request.document_type ?? 'Documento'}
                  <div className="muted">{request.document_number ?? 'No registrado'}</div>
                </td>
                <td>
                  <StatusBadge status={request.status} />
                </td>
                <td>
                  <textarea
                    className="textarea"
                    placeholder="Motivo para rechazo"
                    value={reasonById[request.id] ?? request.rejection_reason ?? ''}
                    onChange={(event) => setReasonById((current) => ({ ...current, [request.id]: event.target.value }))}
                  />
                </td>
                <td>
                  <div className="toolbar">
                    <button
                      className="button primary"
                      type="button"
                      disabled={busyId === request.id}
                      onClick={() => review(request.id, 'approved')}
                    >
                      <CheckCircle2 size={16} />
                      Aprobar
                    </button>
                    <button
                      className="button"
                      type="button"
                      disabled={busyId === request.id}
                      onClick={() => review(request.id, 'rejected')}
                    >
                      <XCircle size={16} />
                      Rechazar
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      disabled={busyId === request.id}
                      onClick={() => review(request.id, 'suspended')}
                    >
                      <Ban size={16} />
                      Suspender
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {requests.length === 0 ? <div className="empty-state">No hay solicitudes para revisar.</div> : null}
    </section>
  );
}

function CategoriesPanel({
  token,
  categories,
  onError,
  onChanged,
}: {
  token: string;
  categories: Category[];
  onError: (message: string | null) => void;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    onError(null);

    try {
      await createCategory(token, {
        name,
        description: description || null,
        status,
      });
      setName('');
      setDescription('');
      setStatus('active');
      await onChanged();
    } catch (caughtError) {
      onError(toErrorMessage(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function toggleCategory(category: Category) {
    setBusy(true);
    onError(null);

    try {
      await updateCategory(token, category.id, {
        status: category.status === 'active' ? 'inactive' : 'active',
      });
      await onChanged();
    } catch (caughtError) {
      onError(toErrorMessage(caughtError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="split">
      <div className="panel">
        <h2>Categorias</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Estado</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                    <div className="muted">{category.description ?? 'Sin descripcion'}</div>
                  </td>
                  <td>{category.slug}</td>
                  <td>
                    <StatusBadge status={category.status} />
                  </td>
                  <td>
                    <button className="button" type="button" disabled={busy} onClick={() => toggleCategory(category)}>
                      {category.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <form className="panel" onSubmit={handleSubmit}>
        <h2>Nueva categoria</h2>
        <div className="grid">
          <div className="field">
            <label htmlFor="category-name">Nombre</label>
            <input
              className="input"
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="category-description">Descripcion</label>
            <textarea
              className="textarea"
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="category-status">Estado</label>
            <select
              className="select"
              id="category-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as 'active' | 'inactive')}
            >
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
            </select>
          </div>
          <button className="button primary" type="submit" disabled={busy}>
            Crear categoria
          </button>
        </div>
      </form>
    </section>
  );
}

function PublicationsPanel({ products }: { products: Product[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Publicaciones visibles</h2>
          <p className="muted">Laravel hoy solo expone el catalogo publico activo para lectura administrativa.</p>
        </div>
      </div>
      <PendingBackendNotice text="Para rechazar, pausar o restaurar publicaciones desde admin falta un endpoint protegido como PATCH /api/admin/products/{product}/moderation." />
      <ProductsTable products={products} />
    </section>
  );
}

function StoresPanel({
  token,
  stores,
  onError,
  onChanged,
}: {
  token: string;
  stores: Store[];
  onError: (message: string | null) => void;
  onChanged: () => Promise<void>;
}) {
  const [busySlug, setBusySlug] = useState<string | null>(null);

  async function toggleStore(store: Store) {
    setBusySlug(store.slug);
    onError(null);

    try {
      await updateStoreStatus(token, store.slug, store.status === 'active' ? 'suspended' : 'active');
      await onChanged();
    } catch (caughtError) {
      onError(toErrorMessage(caughtError));
    } finally {
      setBusySlug(null);
    }
  }

  async function removeStore(store: Store) {
    const confirmed = window.confirm(
      `Eliminar la tienda "${store.name}" tambien eliminara sus productos activos y borradores. Las ordenes conservaran el historial como snapshot. ¿Continuar?`,
    );

    if (!confirmed) {
      return;
    }

    setBusySlug(store.slug);
    onError(null);

    try {
      await deleteStore(token, store.slug);
      await onChanged();
    } catch (caughtError) {
      onError(toErrorMessage(caughtError));
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Tiendas</h2>
          <p className="muted">Suspender retira la tienda del catalogo publico e impide compras de sus productos.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tienda</th>
              <th>Slug</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td>
                  <strong>{store.name}</strong>
                  <div className="muted">{store.description ?? 'Sin descripcion'}</div>
                </td>
                <td>{store.slug}</td>
                <td>
                  <StatusBadge status={store.status} />
                </td>
                <td>
                  <div className="toolbar">
                    <button className="button" type="button" disabled={busySlug === store.slug} onClick={() => toggleStore(store)}>
                      {store.status === 'active' ? 'Suspender' : 'Reactivar'}
                    </button>
                    <button className="button danger" type="button" disabled={busySlug === store.slug} onClick={() => removeStore(store)}>
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UsersPanel() {
  return (
    <section className="grid">
      <PendingBackendNotice text="El backend aun no expone endpoints admin para listar perfiles, bloquear cuentas o enviar advertencias. Esta seccion queda lista para conectar ese modulo sin mezclarlo con comprador o vendedor." />
      <div className="panel">
        <h2>Acciones de confianza</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="user-search">Correo o identificador</label>
            <input className="input" id="user-search" placeholder="usuario@nexo.test" disabled />
          </div>
          <div className="field">
            <label htmlFor="action-type">Accion</label>
            <select className="select" id="action-type" disabled>
              <option>Enviar advertencia</option>
              <option>Bloquear usuario</option>
              <option>Suspender vendedor</option>
            </select>
          </div>
          <div className="field wide">
            <label htmlFor="message">Mensaje interno</label>
            <textarea className="textarea" id="message" disabled />
          </div>
          <button className="button primary" type="button" disabled>
            <Megaphone size={16} />
            Registrar accion
          </button>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ size?: number }>;
}) {
  return (
    <article className="metric-card">
      <Icon size={22} />
      <div className="metric-value">{value}</div>
      <div className="muted">{label}</div>
    </article>
  );
}

function RiskLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="notice">
      <AlertTriangle size={18} />
      <div>
        <strong>{value}</strong>
        <div className="muted">{label}</div>
      </div>
    </div>
  );
}

function RequestsTable({ requests, compact = false }: { requests: SellerVerificationRequest[]; compact?: boolean }) {
  if (requests.length === 0) {
    return <div className="empty-state">Sin solicitudes recientes.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Negocio</th>
            <th>Usuario</th>
            <th>Estado</th>
            {!compact ? <th>Fecha</th> : null}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.business_name}</td>
              <td>{request.profile?.email ?? request.profile_id}</td>
              <td>
                <StatusBadge status={request.status} />
              </td>
              {!compact ? <td>{formatDate(request.created_at)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsTable({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <div className="empty-state">No hay publicaciones visibles.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Tienda</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
                <div className="muted">{product.description ?? 'Sin descripcion'}</div>
              </td>
              <td>{product.store?.name ?? product.store_id}</td>
              <td>{formatMoney(product.price_cents, product.currency)}</td>
              <td>{product.stock}</td>
              <td>
                <StatusBadge status={product.status} />
              </td>
              <td>
                <button className="button" type="button" disabled>
                  Moderar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PendingBackendNotice({ text }: { text: string }) {
  return (
    <div className="notice">
      <AlertTriangle size={18} />
      <p className="muted">{text}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{statusLabels[status] ?? status}</span>;
}

function getSectionTitle(section: Section) {
  const titles: Record<Section, string> = {
    categories: 'Categorias',
    dashboard: 'Centro de control',
    publications: 'Moderacion de publicaciones',
    requests: 'Solicitudes de vendedores',
    stores: 'Gestion de tiendas',
    users: 'Usuarios y advertencias',
  };

  return titles[section];
}

function getSectionDescription(section: Section) {
  const descriptions: Record<Section, string> = {
    categories: 'Organiza el catalogo visible para compradores y vendedores.',
    dashboard: 'Indicadores clave del marketplace y tareas pendientes.',
    publications: 'Supervisa productos publicados y prepara decisiones de moderacion.',
    requests: 'Revisa documentos, aprueba vendedores y suspende perfiles cuando aplique.',
    stores: 'Control operativo sobre tiendas activas y suspendidas.',
    users: 'Base para bloqueos, advertencias, reportes y disputas.',
  };

  return descriptions[section];
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la accion.';
}
