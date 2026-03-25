// src/auth/googleLoader.ts
export const loadGoogleIdentity = (clientId: string) => {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).google?.accounts?.id) {
      resolve();
      return;
    }
    const scriptId = "google-identity-services";
    if (document.getElementById(scriptId)) {
      // script already loading
      const check = () => {
        if ((window as any).google?.accounts?.id) resolve();
        else setTimeout(check, 50);
      };
      check();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};
