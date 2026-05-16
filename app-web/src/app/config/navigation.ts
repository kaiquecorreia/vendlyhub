import {
  LucideIcon,
  LayoutDashboard,
  FolderOpen,
  Package,
  Building2,
  ClipboardList,
} from 'lucide-react';

type RoutesType = {
  [ERouteType.PUBLIC]: string[];
  [ERouteType.PRIVATE]: string[];
};

export enum ERouteType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum ERoutePath {
  HOME = '/',
  PROFILE = '/profile',
  CATEGORIES = '/categories',
  PRODUCTS = '/products',
  ORDERS = '/orders',
  ESTABLISHMENT = '/establishment',
  LOGIN = '/login',
  REGISTER = '/register',
  ONBOARDING_FLOW = '/onboarding-flow',
  FAST_ONBOARDING = '/fast-onboarding',
  AUTH_CALLBACK = '/auth/callback',
  ESQUECI_SENHA = '/esqueci-senha',
  REDEFINIR_SENHA = '/redefinir-senha',
}

export const ROUTES: RoutesType = {
  [ERouteType.PUBLIC]: [
    ERoutePath.LOGIN,
    ERoutePath.REGISTER,
    ERoutePath.ONBOARDING_FLOW,
    ERoutePath.FAST_ONBOARDING,
    ERoutePath.AUTH_CALLBACK,
    ERoutePath.ESQUECI_SENHA,
    ERoutePath.REDEFINIR_SENHA,
  ],
  [ERouteType.PRIVATE]: [
    ERoutePath.HOME,
    ERoutePath.PROFILE,
    ERoutePath.CATEGORIES,
    ERoutePath.PRODUCTS,
    ERoutePath.ORDERS,
    ERoutePath.ESTABLISHMENT,
  ],
};

/**
 * Routing source of truth.
 *
 * How to add new routes:
 * - Public route (no sidebar/topbar + accessible without auth):
 *   add exact path to ROUTES[ERouteType.PUBLIC].
 * - Public dynamic group (e.g. /catalog/[slug]):
 *   add prefix to PUBLIC_ROUTE_PREFIXES.
 * - Private route (requires auth + renders sidebar/topbar):
 *   add exact path to ROUTES[ERouteType.PRIVATE].
 *
 * These helpers are consumed by both middleware (auth checks)
 * and app layout (menu visibility), so this file keeps behavior consistent.
 */
export const PUBLIC_ROUTE_PREFIXES = ['/catalog/'] as const;

export function isPublicPath(path: string): boolean {
  if (ROUTES[ERouteType.PUBLIC].includes(path)) return true;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function isPrivatePath(path: string): boolean {
  return ROUTES[ERouteType.PRIVATE].includes(path);
}

export type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const mainNavigation: NavigationItem[] = [
  {
    name: 'Resumo',
    href: ERoutePath.HOME,
    icon: LayoutDashboard,
  },
  {
    name: 'Categorias',
    href: ERoutePath.CATEGORIES,
    icon: FolderOpen,
  },
  {
    name: 'Produtos',
    href: ERoutePath.PRODUCTS,
    icon: Package,
  },
  {
    name: 'Pedidos',
    href: ERoutePath.ORDERS,
    icon: ClipboardList,
  },
  {
    name: 'Estabelecimento',
    href: ERoutePath.ESTABLISHMENT,
    icon: Building2,
  },
];
