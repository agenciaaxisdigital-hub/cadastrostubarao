import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// ──────────────────────────────────────────────
// 1. PWA Configuration Tests
// ──────────────────────────────────────────────
describe("PWA Configuration", () => {
  const viteConfig = fs.readFileSync(path.resolve("vite.config.ts"), "utf-8");
  const indexHtml = fs.readFileSync(path.resolve("index.html"), "utf-8");
  const mainTsx = fs.readFileSync(path.resolve("src/main.tsx"), "utf-8");

  it("has VitePWA plugin configured", () => {
    expect(viteConfig).toContain("VitePWA");
    expect(viteConfig).toContain('registerType: "autoUpdate"');
  });

  it("has correct manifest settings", () => {
    expect(viteConfig).toContain('"SINDSPAG');
    expect(viteConfig).toContain('"standalone"');
    expect(viteConfig).toContain("icon-192.png");
    expect(viteConfig).toContain("icon-512.png");
  });

  it("has workbox caching strategies", () => {
    expect(viteConfig).toContain("NetworkFirst");
    expect(viteConfig).toContain("CacheFirst");
    expect(viteConfig).toContain("StaleWhileRevalidate");
    expect(viteConfig).toContain("skipWaiting: true");
    expect(viteConfig).toContain("clientsClaim: true");
  });

  it("has API cache with timeout", () => {
    expect(viteConfig).toContain("api-cache");
    expect(viteConfig).toContain("networkTimeoutSeconds");
  });

  it("has PWA meta tags in index.html", () => {
    expect(indexHtml).toContain("theme-color");
    expect(indexHtml).toContain("apple-mobile-web-app-capable");
    expect(indexHtml).toContain("apple-mobile-web-app-status-bar-style");
    expect(indexHtml).toContain("apple-touch-icon");
  });

  it("has viewport meta without enabling zoom on inputs", () => {
    expect(indexHtml).toContain("maximum-scale=1.0");
    expect(indexHtml).toContain("user-scalable=no");
  });

  it("handles SW updates in main.tsx", () => {
    expect(mainTsx).toContain("controllerchange");
    expect(mainTsx).toContain("window.location.reload");
  });

  it("does not register SW in preview/iframe", () => {
    expect(mainTsx).toContain("isPreviewHost");
    expect(mainTsx).toContain("isInIframe");
    expect(mainTsx).toContain("r.unregister");
  });

  it("has PWA icon files", () => {
    expect(fs.existsSync("public/icons/icon-192.png")).toBe(true);
    expect(fs.existsSync("public/icons/icon-512.png")).toBe(true);
  });

  it("icon files are reasonably sized (< 50KB)", () => {
    const s192 = fs.statSync("public/icons/icon-192.png").size;
    const s512 = fs.statSync("public/icons/icon-512.png").size;
    expect(s192).toBeLessThan(50000);
    expect(s512).toBeLessThan(50000);
  });
});

// ──────────────────────────────────────────────
// 2. Routing & App Structure Tests
// ──────────────────────────────────────────────
describe("App Structure", () => {
  const appTsx = fs.readFileSync(path.resolve("src/App.tsx"), "utf-8");

  it("has all required routes", () => {
    expect(appTsx).toContain('path="/"');
    expect(appTsx).toContain('path="/cadastro"');
    expect(appTsx).toContain('path="/associados"');
    expect(appTsx).toContain('path="/associado/:id"');
    expect(appTsx).toContain('path="/usuarios"');
  });

  it("has QueryClientProvider wrapping the app", () => {
    expect(appTsx).toContain("QueryClientProvider");
  });

  it("has AuthProvider wrapping routes", () => {
    expect(appTsx).toContain("AuthProvider");
  });

  it("has redirect from /dashboard to /associados", () => {
    expect(appTsx).toContain('path="/dashboard"');
    expect(appTsx).toContain('to="/associados"');
  });

  it("has NotFound route", () => {
    expect(appTsx).toContain('path="*"');
    expect(appTsx).toContain("NotFound");
  });
});

// ──────────────────────────────────────────────
// 3. Auth Context Tests
// ──────────────────────────────────────────────
describe("Auth Context", () => {
  const authCtx = fs.readFileSync(path.resolve("src/contexts/AuthContext.tsx"), "utf-8");

  it("persists user to localStorage", () => {
    expect(authCtx).toContain("localStorage.setItem");
    expect(authCtx).toContain("sindspag_user");
  });

  it("restores user from localStorage on mount", () => {
    expect(authCtx).toContain("localStorage.getItem");
    expect(authCtx).toContain("JSON.parse");
  });

  it("clears localStorage on logout", () => {
    expect(authCtx).toContain("localStorage.removeItem");
  });

  it("uses supabase RPC for login", () => {
    expect(authCtx).toContain("sindspag_login");
    expect(authCtx).toContain("supabase.rpc");
  });

  it("has loading state", () => {
    expect(authCtx).toContain("isLoading");
    expect(authCtx).toContain("setIsLoading");
  });
});

// ──────────────────────────────────────────────
// 4. Dashboard / Associados Page Tests
// ──────────────────────────────────────────────
describe("Dashboard Page", () => {
  const dashboard = fs.readFileSync(path.resolve("src/pages/Dashboard.tsx"), "utf-8");

  it("has safe query with default empty array", () => {
    expect(dashboard).toContain("= []");
    expect(dashboard).toContain("safeAssociados");
  });

  it("has error handling for query", () => {
    expect(dashboard).toContain("queryError");
    expect(dashboard).toContain("Erro ao carregar");
  });

  it("has search functionality", () => {
    expect(dashboard).toContain("search");
    expect(dashboard).toContain("Buscar");
  });

  it("has date period filters", () => {
    expect(dashboard).toContain("dateFrom");
    expect(dashboard).toContain("dateTo");
    expect(dashboard).toContain('type="date"');
  });

  it("has status and socio filters", () => {
    expect(dashboard).toContain("statusFilter");
    expect(dashboard).toContain("socioFilter");
  });

  it("has XLSX export functionality", () => {
    expect(dashboard).toContain("exportXLSX");
    expect(dashboard).toContain("XLSX");
    expect(dashboard).toContain("Resumo");
    expect(dashboard).toContain("Por Status");
    expect(dashboard).toContain("Por Município");
  });

  it("has detail view with Sheet component", () => {
    expect(dashboard).toContain("Sheet");
    expect(dashboard).toContain("SheetContent");
    expect(dashboard).toContain("viewItem");
  });

  it("cards/rows are clickable to open details", () => {
    expect(dashboard).toContain("onClick={() => setViewItem(a)}");
    expect(dashboard).toContain("stopPropagation");
  });

  it("has responsive layout (mobile cards + desktop table)", () => {
    expect(dashboard).toContain("block sm:hidden");
    expect(dashboard).toContain("hidden sm:block");
  });

  it("prevents horizontal overflow", () => {
    expect(dashboard).toContain("overflow-x-hidden");
  });

  it("has delete confirmation", () => {
    expect(dashboard).toContain("confirm");
    expect(dashboard).toContain("Deseja realmente excluir");
  });

  it("has stats cards (total, sócios, não sócios)", () => {
    expect(dashboard).toContain("totalAssociados");
    expect(dashboard).toContain("totalSocios");
    expect(dashboard).toContain("totalNaoSocios");
  });
});

// ──────────────────────────────────────────────
// 5. Login Page Tests
// ──────────────────────────────────────────────
describe("Login Page", () => {
  const login = fs.readFileSync(path.resolve("src/pages/Login.tsx"), "utf-8");

  it("has username and password fields", () => {
    expect(login).toContain("Usuário");
    expect(login).toMatch(/senha/i);
  });

  it("has remember me / save credentials", () => {
    expect(login).toContain("localStorage");
  });

  it("has InstallPrompt component", () => {
    expect(login).toContain("InstallPrompt");
  });

  it("redirects after login", () => {
    expect(login).toContain("navigate");
    expect(login).toContain("/associados");
  });
});

// ──────────────────────────────────────────────
// 6. InstallPrompt Component Tests
// ──────────────────────────────────────────────
describe("InstallPrompt Component", () => {
  const installPrompt = fs.readFileSync(path.resolve("src/components/InstallPrompt.tsx"), "utf-8");

  it("handles beforeinstallprompt event", () => {
    expect(installPrompt).toContain("beforeinstallprompt");
  });

  it("handles iOS detection", () => {
    expect(installPrompt).toContain("iphone|ipad|ipod");
  });

  it("detects standalone mode", () => {
    expect(installPrompt).toContain("display-mode: standalone");
  });

  it("has dismiss with 24h cooldown", () => {
    expect(installPrompt).toContain("pwa_install_dismissed");
    expect(installPrompt).toContain("86400000");
  });

  it("shows iOS-specific instructions", () => {
    expect(installPrompt).toContain("Compartilhar");
    expect(installPrompt).toContain("Tela de Início");
  });
});

// ──────────────────────────────────────────────
// 7. AppLayout Tests
// ──────────────────────────────────────────────
describe("AppLayout", () => {
  const layout = fs.readFileSync(path.resolve("src/components/AppLayout.tsx"), "utf-8");

  it("has bottom navigation", () => {
    expect(layout).toContain("bottom-0");
    expect(layout).toContain("fixed");
  });

  it("has safe area padding", () => {
    expect(layout).toContain("safe-area-bottom");
  });

  it("prevents overflow", () => {
    expect(layout).toContain("overflow-x-hidden");
  });

  it("has logout button", () => {
    expect(layout).toContain("logout");
    expect(layout).toContain("Sair");
  });

  it("has InstallPrompt", () => {
    expect(layout).toContain("InstallPrompt");
  });
});

// ──────────────────────────────────────────────
// 8. CSS / Design System Tests
// ──────────────────────────────────────────────
describe("CSS & Design System", () => {
  const indexCss = fs.readFileSync(path.resolve("src/index.css"), "utf-8");

  it("has CSS variables for theming", () => {
    expect(indexCss).toContain("--background");
    expect(indexCss).toContain("--foreground");
    expect(indexCss).toContain("--primary");
  });

  it("has safe-area-bottom utility", () => {
    expect(indexCss).toContain("safe-area-bottom");
  });

  it("prevents pull-to-refresh in PWA", () => {
    expect(indexCss).toContain("overscroll-behavior");
  });

  it("prevents auto-zoom on iOS inputs", () => {
    expect(indexCss).toMatch(/font-size.*16px|16px/);
  });
});

// ──────────────────────────────────────────────
// 9. Usuarios Page Tests
// ──────────────────────────────────────────────
describe("Usuarios Page", () => {
  const usuarios = fs.readFileSync(path.resolve("src/pages/Usuarios.tsx"), "utf-8");

  it("lists users", () => {
    expect(usuarios).toContain("sindspag_usuarios");
  });

  it("has create user functionality", () => {
    expect(usuarios).toContain("sindspag_criar_usuario");
  });

  it("has password reset", () => {
    expect(usuarios).toContain("sindspag_resetar_senha");
  });

  it("has delete user (admin only)", () => {
    expect(usuarios).toContain("sindspag_deletar_usuario");
  });
});

// ──────────────────────────────────────────────
// 10. AssociadoForm Page Tests
// ──────────────────────────────────────────────
describe("AssociadoForm Page", () => {
  const form = fs.readFileSync(path.resolve("src/pages/AssociadoForm.tsx"), "utf-8");

  it("handles both create and edit mode", () => {
    expect(form).toContain("useParams");
    expect(form).toContain(".insert");
    expect(form).toContain(".update");
  });

  it("has form validation", () => {
    expect(form).toMatch(/nome.*\.trim\(\)/);
  });

  it("has all required field sections", () => {
    expect(form).toContain("nome");
    expect(form).toContain("cpf");
    expect(form).toContain("telefone");
    expect(form).toContain("titulo_eleitor");
    expect(form).toContain("zona_eleitoral");
    expect(form).toContain("ligacao_politica");
  });

  it("has ligacao_politica in electoral section (not separate)", () => {
    expect(form).toContain("ligacao_politica");
    expect(form).not.toContain("PERFIL E STATUS");
    expect(form).not.toContain("comprometimento");
    expect(form).not.toContain("posicao_ligacao");
  });

  it("has success toast on save", () => {
    expect(form).toContain("toast.success");
  });
});
