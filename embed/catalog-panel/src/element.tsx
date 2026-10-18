import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import './index.css';
import App from './App';
import type { PanelHost, PanelSection } from './host';

/*
 * <catalog-panel>: el editor de la tienda como componente web, para que el
 * ERP lo monte en Venta online › Tienda (cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md).
 *
 *   const el = document.createElement('catalog-panel')
 *   el.host = { appBase, getToken, navigate, onSessionLost }
 *   el.path = '/diseno'      // sección actual: '/', '/diseno', '/ajustes', '/bienvenida'
 *   el.channel = 'catalog'   // el canal (código de la app)
 *   el.theme = 'light'
 *   el.navigation = 'host'   // 'host': las secciones las dibuja el ERP en su encabezado (P6)
 *   contenedor.append(el)
 *
 * Con `navigation = 'host'` el paquete no dibuja su barra de secciones: las
 * publica en `el.sections` y con el evento `sections` (la misma lista en
 * `detail`), y las vuelve a publicar cuando cambian. En /bienvenida, vacía.
 * El ERP marca la activa según `el.path` y, al tocar una, cambia `el.path`.
 *
 * Sin shadow DOM, como el CRM: el aislamiento lo da el CSS, todo bajo
 * `.catalog-panel`. Los modales se montan dentro de esa raíz, no en `body`.
 */
class CatalogPanelElement extends HTMLElement {
  #host: PanelHost | null = null;
  #path = '/';
  #channel = 'catalog';
  #theme = 'light';
  #navigation: 'host' | 'self' = 'self';
  #sections: PanelSection[] = [];
  #root: Root | null = null;
  #mount: HTMLDivElement | null = null;

  set host(value: PanelHost) {
    this.#host = value;
    this.#render();
  }
  get host(): PanelHost | null {
    return this.#host;
  }

  set path(value: string) {
    this.#path = value || '/';
    this.#render();
  }
  get path(): string {
    return this.#path;
  }

  set channel(value: string) {
    this.#channel = value || 'catalog';
    this.#render();
  }
  get channel(): string {
    return this.#channel;
  }

  set theme(value: string) {
    this.#theme = value === 'dark' ? 'dark' : 'light';
    if (this.#mount) this.#mount.dataset.theme = this.#theme;
  }
  get theme(): string {
    return this.#theme;
  }

  set navigation(value: string) {
    this.#navigation = value === 'host' ? 'host' : 'self';
    this.#render();
  }
  get navigation(): string {
    return this.#navigation;
  }

  /** Las secciones del editor, para que el ERP las ponga en su encabezado. */
  get sections(): PanelSection[] {
    return this.#sections;
  }

  #publishSections = (sections: PanelSection[]) => {
    if (JSON.stringify(sections) === JSON.stringify(this.#sections)) return;
    this.#sections = sections;
    this.dispatchEvent(new CustomEvent('sections', { detail: sections }));
  };

  connectedCallback() {
    this.style.display = 'block';
    this.#mount = document.createElement('div');
    this.#mount.className = 'catalog-panel';
    this.#mount.dataset.theme = this.#theme;
    this.append(this.#mount);
    this.#root = createRoot(this.#mount);
    this.#render();
  }

  disconnectedCallback() {
    // React pide no desmontar en mitad de un render: se cede el turno.
    const root = this.#root;
    const mount = this.#mount;
    this.#root = this.#mount = null;
    queueMicrotask(() => {
      root?.unmount();
      mount?.remove();
    });
  }

  #render() {
    if (!this.#root || !this.#host) return;
    this.#root.render(
      <StrictMode>
        <App host={this.#host} path={this.#path} navigation={this.#navigation} onSections={this.#publishSections} />
      </StrictMode>
    );
  }
}

if (!customElements.get('catalog-panel')) customElements.define('catalog-panel', CatalogPanelElement);
