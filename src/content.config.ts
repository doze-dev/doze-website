import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "astro/zod";
import { topicSchema } from "starlight-sidebar-topics/schema";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      // redirect_from: the page's old addresses; scripts/docs-pull.ts turns
      // them into 301s in public/_redirects.
      extend: topicSchema.extend({ redirect_from: z.array(z.string()).optional() }),
    }),
  }),
};
