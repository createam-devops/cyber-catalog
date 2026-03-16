"use client";

import { useEffect, useState } from "react";
import { TenantAuditLog, TenantConfig, TenantStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Store, 
  Check, 
  X, 
  Settings, 
  Pause,
  ExternalLink,
  ArrowLeft,
  RefreshCcw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type TenantApiItem = Omit<TenantConfig, "createdAt" | "updatedAt" | "approvedAt"> & {
  createdAt?: string | null;
  updatedAt?: string | null;
  approvedAt?: string | null;
};

async function adminApiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || "Error en API de administración");
  }

  return payload as T;
}

function normalizeTenantDates(tenant: TenantApiItem): TenantConfig {
  return {
    ...tenant,
    createdAt: tenant.createdAt ? new Date(tenant.createdAt) : new Date(),
    updatedAt: tenant.updatedAt ? new Date(tenant.updatedAt) : new Date(),
    approvedAt: tenant.approvedAt ? new Date(tenant.approvedAt) : undefined,
  } as TenantConfig;
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TenantStatus | "all">("all");
  const [selectedTenant, setSelectedTenant] = useState<TenantConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<TenantAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTenantId, setAuditTenantId] = useState("");
  const [auditActionPreset, setAuditActionPreset] = useState("");
  const [auditActionCustom, setAuditActionCustom] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [auditLimit, setAuditLimit] = useState("100");
  const [auditHasMore, setAuditHasMore] = useState(false);
  const [auditNextCursor, setAuditNextCursor] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, [filter]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadTenants() {
    setLoading(true);
    try {
      const statusParam = filter === "all" ? "all" : filter;
      const data = await adminApiFetch<{ tenants: TenantApiItem[] }>(`/api/admin/tenants?status=${statusParam}`);
      setTenants((data.tenants || []).map(normalizeTenantDates));
    } catch (error) {
      console.error("Error loading tenants:", error);
      toast.error("Error al cargar tenants");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(tenantId: string, newStatus: TenantStatus) {
    try {
      await adminApiFetch<{ ok: boolean }>(`/api/admin/tenants/${tenantId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Tenant ${newStatus === 'active' ? 'aprobado' : 'actualizado'}`);
      loadTenants();
    } catch {
      toast.error("Error al actualizar estado");
    }
  }

  async function handleConfigUpdate(tenantId: string, config: Partial<TenantConfig>) {
    try {
      await adminApiFetch<{ ok: boolean }>(`/api/admin/tenants/${tenantId}/config`, {
        method: "PATCH",
        body: JSON.stringify(config),
      });
      toast.success("Configuración actualizada");
      setSelectedTenant(null);
      loadTenants();
    } catch {
      toast.error("Error al actualizar configuración");
    }
  }

  async function loadAuditLogs(options?: { append?: boolean; cursor?: string | null }) {
    setAuditLoading(true);

    try {
      const resolvedAction =
        auditActionPreset === '__custom__' ? auditActionCustom.trim() : auditActionPreset.trim();

      const params = new URLSearchParams();
      if (auditTenantId.trim()) params.set('tenantId', auditTenantId.trim());
      if (resolvedAction) params.set('action', resolvedAction);
      if (auditFrom) params.set('from', new Date(auditFrom).toISOString());
      if (auditTo) params.set('to', new Date(auditTo).toISOString());

      const parsedLimit = Number(auditLimit);
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        params.set('limit', String(parsedLimit));
      }

      if (options?.cursor) {
        params.set('cursor', options.cursor);
      }

      const query = params.toString();
      const url = query ? `/api/admin/audit?${query}` : '/api/admin/audit';

      const data = await adminApiFetch<{ logs: TenantAuditLog[]; hasMore?: boolean; nextCursor?: string | null }>(url);
      const logs = data.logs || [];

      setAuditLogs((prev) => (options?.append ? [...prev, ...logs] : logs));
      setAuditHasMore(Boolean(data.hasMore));
      setAuditNextCursor(data.nextCursor || null);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Error al cargar auditoria');
    } finally {
      setAuditLoading(false);
    }
  }

  function exportAuditCsv() {
    if (auditLogs.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = [
      'id',
      'createdAt',
      'tenantId',
      'action',
      'resource',
      'resourceId',
      'actorUid',
      'actorEmail',
      'actorRole',
      'metadata',
    ];

    const escapeCsv = (value: unknown) => {
      const raw = value == null ? '' : String(value);
      return `"${raw.replace(/"/g, '""')}"`;
    };

    const rows = auditLogs.map((log) => [
      log.id,
      log.createdAt || '',
      log.tenantId || '',
      log.action || '',
      log.resource || '',
      log.resourceId || '',
      log.actor?.uid || '',
      log.actor?.email || '',
      log.actor?.role || '',
      JSON.stringify(log.metadata || {}),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const pendingCount = tenants.filter(t => t.status === 'pending').length;
  const activeCount = tenants.filter(t => t.status === 'active').length;

  if (selectedTenant) {
    return (
      <TenantConfigEditor
        tenant={selectedTenant}
        onSave={handleConfigUpdate}
        onCancel={() => setSelectedTenant(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Gestión de Tenants</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total"
            value={tenants.length}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <StatCard
            title="Pendientes"
            value={pendingCount}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            variant="warning"
          />
          <StatCard
            title="Activos"
            value={activeCount}
            active={filter === "active"}
            onClick={() => setFilter("active")}
            variant="success"
          />
          <StatCard
            title="Suspendidos"
            value={tenants.filter(t => t.status === 'suspended').length}
            active={filter === "suspended"}
            onClick={() => setFilter("suspended")}
            variant="error"
          />
        </div>

        {/* Tenants List */}
        <Card>
          <CardHeader>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>
              {filter === "all" ? "Todos los tenants" : `Tenants ${filter}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay tenants {filter !== "all" && filter}
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <TenantCard
                    key={tenant.id}
                    tenant={tenant}
                    onApprove={() => handleStatusChange(tenant.id, 'active')}
                    onReject={() => handleStatusChange(tenant.id, 'rejected')}
                    onSuspend={() => handleStatusChange(tenant.id, 'suspended')}
                    onConfigure={() => setSelectedTenant(tenant)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="inline-flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Auditoria de Tenants
                </CardTitle>
                <CardDescription>
                  Eventos de create/update/delete en productos, categorias y settings.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => loadAuditLogs()} disabled={auditLoading}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Recargar
                </Button>
                <Button variant="outline" onClick={exportAuditCsv}>
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              <div className="space-y-1">
                <Label>Tenant ID</Label>
                <Input
                  value={auditTenantId}
                  onChange={(e) => setAuditTenantId(e.target.value)}
                  placeholder="ej: bellasorpresa"
                />
              </div>
              <div className="space-y-1">
                <Label>Accion</Label>
                <select
                  value={auditActionPreset}
                  onChange={(e) => setAuditActionPreset(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Todas</option>
                  <option value="product.created">product.created</option>
                  <option value="product.updated">product.updated</option>
                  <option value="product.deleted">product.deleted</option>
                  <option value="category.created">category.created</option>
                  <option value="category.updated">category.updated</option>
                  <option value="category.deleted">category.deleted</option>
                  <option value="tenant.settings.updated">tenant.settings.updated</option>
                  <option value="__custom__">Otra accion...</option>
                </select>
                {auditActionPreset === '__custom__' && (
                  <Input
                    value={auditActionCustom}
                    onChange={(e) => setAuditActionCustom(e.target.value)}
                    placeholder="ej: custom.action"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label>Desde</Label>
                <Input
                  type="datetime-local"
                  value={auditFrom}
                  onChange={(e) => setAuditFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Hasta</Label>
                <Input
                  type="datetime-local"
                  value={auditTo}
                  onChange={(e) => setAuditTo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Limite</Label>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={auditLimit}
                  onChange={(e) => setAuditLimit(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4 flex gap-2">
              <Button onClick={() => loadAuditLogs()} disabled={auditLoading}>Aplicar filtros</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAuditTenantId('');
                  setAuditActionPreset('');
                  setAuditActionCustom('');
                  setAuditFrom('');
                  setAuditTo('');
                  setAuditLimit('100');
                  setAuditHasMore(false);
                  setAuditNextCursor(null);
                }}
              >
                Limpiar
              </Button>
            </div>

            {auditLoading ? (
              <div className="text-center py-6">Cargando auditoria...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No hay eventos para los filtros actuales</div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold">{log.action || 'unknown.action'}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        tenant: {log.tenantId || 'n/a'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        recurso: {log.resource || 'n/a'}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs mb-2">
                      actor: {log.actor?.email || log.actor?.uid || 'desconocido'}
                      {log.createdAt ? ` | ${new Date(log.createdAt).toLocaleString()}` : ''}
                    </div>
                    <div className="text-xs bg-muted/40 rounded p-2 overflow-auto">
                      <pre>{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                    </div>
                  </div>
                ))}
                {auditHasMore && auditNextCursor && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => loadAuditLogs({ append: true, cursor: auditNextCursor })}
                      disabled={auditLoading}
                    >
                      Cargar mas
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  active, 
  onClick, 
  variant = "default" 
}: { 
  title: string; 
  value: number; 
  active: boolean; 
  onClick: () => void;
  variant?: "default" | "warning" | "success" | "error";
}) {
  const variantStyles = {
    default: "border-border",
    warning: "border-yellow-500",
    success: "border-green-500",
    error: "border-red-500",
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${active ? 'ring-2 ring-primary' : ''} ${variantStyles[variant]}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function TenantCard({ 
  tenant, 
  onApprove, 
  onReject, 
  onSuspend, 
  onConfigure 
}: {
  tenant: TenantConfig;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onConfigure: () => void;
}) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    rejected: "bg-gray-100 text-gray-800",
    trial: "bg-purple-100 text-purple-800",
  };

  const domain = tenant.domain || `${tenant.subdomain}.createam.cloud`;

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{tenant.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[tenant.status]}`}>
              {tenant.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{tenant.email}</p>
          <a 
            href={`https://${domain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            {domain}
            <ExternalLink className="h-3 w-3" />
          </a>
          {tenant.whatsapp && (
            <p className="text-sm text-muted-foreground mt-1">
              WhatsApp: {tenant.whatsapp}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {tenant.status === 'pending' && (
            <>
              <Button size="sm" variant="default" onClick={onApprove}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {tenant.status === 'active' && (
            <Button size="sm" variant="outline" onClick={onSuspend}>
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onConfigure}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TenantConfigEditor({ 
  tenant, 
  onSave, 
  onCancel 
}: {
  tenant: TenantConfig;
  onSave: (tenantId: string, config: Partial<TenantConfig>) => void;
  onCancel: () => void;
}) {
  const [config, setConfig] = useState({
    logo: tenant.logo || "",
    primaryColor: tenant.colors?.primary || "",
    secondaryColor: tenant.colors?.secondary || "",
    whatsapp: tenant.whatsapp || "",
    firebaseApiKey: tenant.firebaseConfig.apiKey || "",
    firebaseAuthDomain: tenant.firebaseConfig.authDomain || "",
    firebaseProjectId: tenant.firebaseConfig.projectId || "",
    firebaseStorageBucket: tenant.firebaseConfig.storageBucket || "",
    firebaseMessagingSenderId: tenant.firebaseConfig.messagingSenderId || "",
    firebaseAppId: tenant.firebaseConfig.appId || "",
  });

  const handleSave = () => {
    onSave(tenant.id, {
      logo: config.logo,
      colors: {
        primary: config.primaryColor,
        secondary: config.secondaryColor,
      },
      whatsapp: config.whatsapp,
      firebaseConfig: {
        apiKey: config.firebaseApiKey,
        authDomain: config.firebaseAuthDomain,
        projectId: config.firebaseProjectId,
        storageBucket: config.firebaseStorageBucket,
        messagingSenderId: config.firebaseMessagingSenderId,
        appId: config.firebaseAppId,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurar {tenant.name}</CardTitle>
            <CardDescription>Personaliza la tienda de tu cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Branding */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Branding</h3>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={config.logo}
                  onChange={(e) => setConfig({ ...config, logo: e.target.value })}
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color Primario (HSL)</Label>
                  <Input
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    placeholder="222.2 47.4% 11.2%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color Secundario (HSL)</Label>
                  <Input
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    placeholder="210 40% 96.1%"
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contacto</h3>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={config.whatsapp}
                  onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                  placeholder="+51999999999"
                />
              </div>
            </div>

            {/* Firebase Config */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración Firebase</h3>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  value={config.firebaseApiKey}
                  onChange={(e) => setConfig({ ...config, firebaseApiKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Auth Domain</Label>
                <Input
                  value={config.firebaseAuthDomain}
                  onChange={(e) => setConfig({ ...config, firebaseAuthDomain: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Project ID</Label>
                <Input
                  value={config.firebaseProjectId}
                  onChange={(e) => setConfig({ ...config, firebaseProjectId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Storage Bucket</Label>
                <Input
                  value={config.firebaseStorageBucket}
                  onChange={(e) => setConfig({ ...config, firebaseStorageBucket: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Messaging Sender ID</Label>
                <Input
                  value={config.firebaseMessagingSenderId}
                  onChange={(e) => setConfig({ ...config, firebaseMessagingSenderId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>App ID</Label>
                <Input
                  value={config.firebaseAppId}
                  onChange={(e) => setConfig({ ...config, firebaseAppId: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} className="flex-1">
                Guardar Configuración
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
