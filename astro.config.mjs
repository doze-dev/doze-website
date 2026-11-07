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
      logo: { src: "./public/brand/doze.svg", alt: "doze" },
      favicon: "/favicon-32.png",
      customCss: ["./src/styles/tokens.css", "./src/styles/docs.css"],
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/doze-dev" }],
      lastUpdated: false,
      // The boards' docs frame (design/boards/DozeDocs.dc.html and friends):
      // the site header, a product switcher and search in the sidebar,
      // breadcrumbs, previous/next cards. Each override is in src/components/docs/.
      components: {
        Header: "./src/components/docs/Header.astro",
        PageFrame: "./src/components/docs/PageFrame.astro",
        Sidebar: "./src/components/docs/Sidebar.astro",
        TwoColumnContent: "./src/components/docs/TwoColumnContent.astro",
        PageSidebar: "./src/components/docs/PageSidebar.astro",
        ContentPanel: "./src/components/docs/ContentPanel.astro",
        PageTitle: "./src/components/docs/PageTitle.astro",
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
        starlightSidebarTopics(topics, {
          topics: { doze: ["/docs/doze/**/*"], aws: ["/docs/aws/**/*"], kafka: ["/docs/kafka/**/*"] },
          exclude: ["/404"],
        }),
      ],
    }),
  ],
});
