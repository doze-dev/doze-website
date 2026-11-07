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
      title: "doze docs",
      description: "Docs for doze, doze AWS and doze Kafka.",
      logo: { src: "./public/brand/doze.svg", alt: "doze" },
      favicon: "/favicon-32.png",
      customCss: ["./src/styles/tokens.css", "./src/styles/docs.css"],
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/doze-dev" }],
      lastUpdated: false,
      expressiveCode: { themes: ["github-dark"], styleOverrides: { borderRadius: "0.6rem" } },
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
