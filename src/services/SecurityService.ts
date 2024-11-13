export class SecurityService {
  private static instance: SecurityService;
  private screenshotListeners: Set<() => void> = new Set();

  private constructor() {
    this.initScreenshotDetection();
  }

  static getInstance() {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private initScreenshotDetection() {
    // Web-based screenshot detection
    document.addEventListener('keydown', (e) => {
      const isScreenshotKey = (
        (e.key === 'PrintScreen') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.shiftKey && e.key === '4') // Mac screenshot shortcut
      );

      if (isScreenshotKey) {
        this.notifyScreenshotTaken();
      }
    });
  }

  async preventScreenshots(enabled: boolean) {
    if (enabled) {
      // Web-based screenshot prevention techniques
      document.addEventListener('contextmenu', this.preventDefault);
      document.addEventListener('keydown', this.preventScreenshotKeys);
      this.addMetaTags();
    } else {
      document.removeEventListener('contextmenu', this.preventDefault);
      document.removeEventListener('keydown', this.preventScreenshotKeys);
      this.removeMetaTags();
    }
  }

  private addMetaTags() {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'user-select');
    meta.setAttribute('content', 'none');
    document.head.appendChild(meta);
  }

  private removeMetaTags() {
    const meta = document.querySelector('meta[name="user-select"]');
    if (meta) {
      meta.remove();
    }
  }

  private preventDefault(e: Event) {
    e.preventDefault();
  }

  private preventScreenshotKeys(e: KeyboardEvent) {
    if (
      (e.key === 'PrintScreen') ||
      (e.ctrlKey && e.key === 'p') ||
      (e.metaKey && e.shiftKey && e.key === '4')
    ) {
      e.preventDefault();
    }
  }

  addScreenshotListener(callback: () => void) {
    this.screenshotListeners.add(callback);
  }

  removeScreenshotListener(callback: () => void) {
    this.screenshotListeners.delete(callback);
  }

  private notifyScreenshotTaken() {
    this.screenshotListeners.forEach(listener => listener());
  }
}