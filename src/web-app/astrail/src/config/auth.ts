/**
 * OAuth2 Authentication configuration constants.
 * Follows React/Vite best practices by sourcing variables from the environment
 * with safe fallback defaults for local development.
 */

export const OAUTH2_CONFIG = {
  // Authorization server base URL
  authServerUrl: import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:9000',

  // Registered Client ID for the BFF/Gateway
  clientId: import.meta.env.VITE_CLIENT_ID || 'my-client-gateway',

  // Redirect URI registered with the Auth Server
  redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:8080/login/oauth2/code/gateway',

  // Required OAuth2/OIDC scopes
  scope: import.meta.env.VITE_AUTH_SCOPE || 'openid read',

  // Response type for authorization code flow
  responseType: 'code',

  // API Base URL for live connection testing and data fetching
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000',
} as const;

/**
 * Builds the complete OAuth2 Authorization redirect URL.
 * Combines the authorization server base URL, client ID, redirect URI, scope, and response type.
 */
export const getOAuth2AuthorizeUrl = (): string => {
  const params = new URLSearchParams({
    response_type: OAUTH2_CONFIG.responseType,
    client_id: OAUTH2_CONFIG.clientId,
    redirect_uri: OAUTH2_CONFIG.redirectUri,
    scope: OAUTH2_CONFIG.scope,
  });

  return `${OAUTH2_CONFIG.authServerUrl}/api/auth/authorize?${params.toString()}`;
};

/**
 * Builds the backend logout URL.
 */
export const getLogoutUrl = (): string => {
  return `${OAUTH2_CONFIG.authServerUrl}/logout`;
};
