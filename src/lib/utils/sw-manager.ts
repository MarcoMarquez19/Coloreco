/**
 * Gestor del Service Worker para Coloreco
 * Maneja el registro, actualización y precarga de assets
 */

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Registra el Service Worker
   */
  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers no están soportados en este navegador');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registrado:', this.registration.scope);

      // Escuchar actualizaciones
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              console.log('Nueva versión del Service Worker disponible');
              this.onUpdateAvailable();
            }
          });
        }
      });

      // Verificar actualizaciones cada hora
      setInterval(() => {
        this.registration?.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  }

  /**
   * Precarga archivos estáticos específicos
   */
  async precacheAssets(urls: string[]): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      console.warn('No hay Service Worker activo para precachear assets');
      return;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'PRECACHE_ASSETS',
      urls
    });
  }

  /**
   * Precarga todos los archivos estáticos conocidos
   */
  async precacheAllStaticAssets(): Promise<void> {
    const staticAssets = await this.getStaticAssetUrls();
    await this.precacheAssets(staticAssets);
  }

  /**
   * Obtiene las URLs de todos los archivos estáticos
   */
  private async getStaticAssetUrls(): Promise<string[]> {
    const assets: string[] = [];

    try {
      // Cargar los JSONs de configuración
      const [escenasRes, historiasRes, logrosRes, pictogramsRes] = await Promise.all([
        fetch('/escenas/escenas.json').catch(() => null),
        fetch('/historias/historias.json').catch(() => null),
        fetch('/logros/logros.json').catch(() => null),
        fetch('/pictograms/pictogramas.json').catch(() => null)
      ]);

      // Procesar escenas
      if (escenasRes?.ok) {
        const escenas = await escenasRes.json();
        if (Array.isArray(escenas)) {
          escenas.forEach((escena: any) => {
            if (escena.imagen) assets.push(escena.imagen);
            if (escena.audio) assets.push(escena.audio);
          });
        }
      }

      // Procesar historias
      if (historiasRes?.ok) {
        const historias = await historiasRes.json();
        if (Array.isArray(historias)) {
          historias.forEach((historia: any) => {
            if (historia.portada) assets.push(historia.portada);
            if (historia.audio) assets.push(historia.audio);
            // Agregar capítulos
            if (historia.capitulos) {
              historia.capitulos.forEach((cap: string) => {
                assets.push(`/historias/${historia.id}/${cap}.json`);
              });
            }
          });
        }
      }

      // Procesar logros
      if (logrosRes?.ok) {
        const logros = await logrosRes.json();
        if (Array.isArray(logros)) {
          logros.forEach((logro: any) => {
            if (logro.icono) assets.push(logro.icono);
            if (logro.imagen) assets.push(logro.imagen);
          });
        }
      }

      // Procesar pictogramas
      if (pictogramsRes?.ok) {
        const pictogramas = await pictogramsRes.json();
        if (typeof pictogramas === 'object') {
          Object.values(pictogramas).forEach((pictogram: any) => {
            if (pictogram?.imagen) assets.push(pictogram.imagen);
          });
        }
      }

      // Agregar archivos de audio comunes
      const commonAudio = [
        '/audio/effects/click.mp3',
        '/audio/effects/success.mp3',
        '/audio/effects/error.mp3',
        '/audio/music/background.mp3'
      ];
      assets.push(...commonAudio);

    } catch (error) {
      console.error('Error al obtener URLs de assets estáticos:', error);
    }

    return [...new Set(assets)]; // Eliminar duplicados
  }

  /**
   * Callback cuando hay una actualización disponible
   */
  private onUpdateAvailable(): void {
    // Puedes implementar una UI para notificar al usuario
    // Por ahora, solo registramos en consola
    console.log('Actualización de la aplicación disponible');
  }

  /**
   * Forzar activación de la nueva versión
   */
  skipWaiting(): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING'
      });
    }
  }

  /**
   * Limpiar cache antiguo
   */
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      console.log('Cache limpiada');
    }
  }
}

// Instancia singleton
export const swManager = new ServiceWorkerManager();
