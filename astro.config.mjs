// doze-dev.com. Marketing pages are plain Astro pages in src/pages; the docs
// are Starlight under /docs/<product>/, pulled from each product's repo by
// scripts/docs-pull.ts (see sources.json).
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightSidebarTopics from "starlight-sidebar-topics";
import { topics } from "./src/sidebars.ts";

export default defineConfig({
  site: "https://doze-dev.com",
  trailingSlash: "always",
  integrations: [
    starlight({
      // the site has its own 404 (src/pages/404.astro)
      disable404Route: true,
      title: "doze docs",
      description: "Docs for doze, doze AWS and doze Kafka.",
      favicon: "/favicon-32.png",
      customCss: ["./src/styles/tokens.css", "./src/styles/docs.css"],
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/doze-dev" }],
      lastUpdated: false,
      // The docs frame of the boards (Docs2Header, Docs2Side, Docs2Task, …):
      // the site header, a docs bar (product, search, version), the sidebar,
      // breadcrumbs, the right rail, previous/next cards. No logo: the site
      // header (SiteHeader) carries the family mark. Each override is in
      // src/components/docs/; the product homes come from src/routeData.ts.
      components: {
        Header: "./src/components/docs/Header.astro",
        PageFrame: "./src/components/docs/PageFrame.astro",
        Sidebar: "./src/components/docs/Sidebar.astro",
        TwoColumnContent: "./src/components/docs/TwoColumnContent.astro",
        PageSidebar: "./src/components/docs/PageSidebar.astro",
        ContentPanel: "./src/components/docs/ContentPanel.astro",
        PageTitle: "./src/components/docs/PageTitle.astro",
        MarkdownContent: "./src/components/docs/MarkdownContent.astro",
        Footer: "./src/components/docs/Footer.astro",
        Pagination: "./src/components/docs/Pagination.astro",
        EditLink: "./src/components/docs/EditLink.astro",
        ThemeProvider: "./src/components/docs/ThemeProvider.astro",
      },
      // Code blocks stay dark on the daylight page (brief: #1E1328 ground,
      // #F4ECE4 text, #9C8AAB muted), each with a Copy button.
      expressiveCode: {
        themes: ["github-dark"],
        useStarlightUiThemeColors: false,
        useStarlightDarkModeSwitch: false,
        styleOverrides: {
          borderRadius: "14px",
          borderColor: "#2E1F3A",
          codeBackground: "#1E1328",
          codeForeground: "#F4ECE4",
          codeFontFamily: "var(--font-mono)",
          codeFontSize: "14px",
          codeLineHeight: "1.75",
          codePaddingBlock: "16px",
          codePaddingInline: "20px",
          uiFontFamily: "var(--font-text)",
          uiFontSize: "13px",
          frames: {
            editorBackground: "#1E1328",
            terminalBackground: "#1E1328",
            editorTabBarBackground: "#1E1328",
            editorActiveTabBackground: "#1E1328",
            editorActiveTabForeground: "#C9BAD3",
            editorActiveTabIndicatorTopColor: "transparent",
            editorActiveTabIndicatorBottomColor: "transparent",
            editorTabBarBorderBottomColor: "#2E1F3A",
            terminalTitlebarBackground: "#1E1328",
            terminalTitlebarForeground: "#C9BAD3",
            terminalTitlebarBorderBottomColor: "#2E1F3A",
            terminalTitlebarDotsForeground: "#4A3458",
            terminalTitlebarDotsOpacity: "1",
            inlineButtonBackground: "#2A1C36",
            inlineButtonForeground: "#F4ECE4",
            inlineButtonBorder: "#4A3458",
            inlineButtonBackgroundIdleOpacity: "1",
            inlineButtonBackgroundHoverOrFocusOpacity: "1",
            inlineButtonBorderOpacity: "1",
            frameBoxShadowCssValue: "none",
            tooltipSuccessBackground: "#1D7A45",
          },
        },
      },
      // Pages a sidebar leaves out still belong to their product.
      plugins: [
        // The product homes (src/routeData.ts) must turn a splash index into a
        // page with a sidebar before the topics plugin picks the sidebar.
        {
          name: "doze-docs-homes",
          hooks: {
            "config:setup"({ addRouteMiddleware }) {
              addRouteMiddleware({ entrypoint: "./src/routeData.ts", order: "pre" });
            },
          },
        },
        starlightSidebarTopics(topics, {
          topics: { doze: ["/docs/doze/**/*"], aws: ["/docs/aws/**/*"], kafka: ["/docs/kafka/**/*"] },
          exclude: ["/404"],
        }),
      ],
    }),
  ],
});
