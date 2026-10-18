import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import './index.css';
import App from './App';
import type { PanelHost } from './host';

/*
 * <catalog-panel>: el editor de la tienda como componente web, para que el
 * ERP lo monte en Venta online › Tienda (cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md).
 *
 *   const el = document.createElement('catalog-panel')
 *   el.host = { appBase, getToken, navigate, onSessionLost }
 *   el.path = '/diseno'      // sección actual: '/', '/diseno', '/ajustes', '/bienvenida'
 *   el.channel = 'catalog'   // el canal (código de la app)
 *   el.theme = 'light'
 *   contenedor.append(el)
 *
 * Sin shadow DOM, como el CRM: el aislamiento lo da el CSS, todo bajo
 * `.catalog-panel`. Los modales se montan dentro de esa raíz, no en `body`.
 */
class CatalogPanelElement extends HTMLElement {
  #host: PanelHost | null = null;
  #path = '/';
  #channel = 'catalog';
  #theme = 'light';
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
        <App host={this.#host} path={this.#path} />
      </StrictMode>
    );
  }
}

if (!customElements.get('catalog-panel')) customElements.define('catalog-panel', CatalogPanelElement);
