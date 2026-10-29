import { defineCliConfig } from "sanity/cli"

/** Lets `npx sanity ...` (dataset export/import, etc.) find this project. */
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  },
})
