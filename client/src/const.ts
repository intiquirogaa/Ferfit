//export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.

//console.log("Variables de entorno cargadas por Vite:", import.meta.env);
//export const getLoginUrl = () => {
  //const oauthPortalUrl = "https://api.manus.ai"; 
  //const appId = "evigym-pro-app";
  
  //const redirectUri = `${window.location.origin}/api/oauth/callback`;//
  //const state = btoa(redirectUri);

  //const url = new URL(`${oauthPortalUrl}/app-auth`);
  //url.searchParams.set("appId", appId);
  //url.searchParams.set("redirectUri", redirectUri);
  //url.searchParams.set("state", state);
  //url.searchParams.set("type", "signIn");

  //return url.toString();
//};
// export const performLogin = () => {
  // const loginUrl = getLoginUrl();
  // console.log("Redirigiendo a:", loginUrl);
 // window.location.href = loginUrl;
// };

export const getLoginUrl = () => {
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!portalUrl || !appId) {
    throw new Error('La variable VITE_OAUTH_PORTAL_URL no está cargada.');
  }

  const url = new URL('/oauth/authorize', portalUrl);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', `${window.location.origin}/oauth/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', 'random-state'); // opcional pero recomendado

  return url.toString();
};