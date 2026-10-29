"use client"

import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { apiVersion, dataset, projectId } from "./src/sanity/env"
import { contentPages, pageDocumentId } from "./src/sanity/pages"
import { schemaTypes, singletonTypes } from "./src/sanity/schemas"

export default defineConfig({
  name: "ritz-and-ron",
  title: "Ritz & Ron",
  basePath: "/studio",
  projectId: projectId || "missing-project-id",
  dataset,
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      singletonTypes.has(schemaType)
        ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : actions,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Home page")
              .id("homePage")
              .child(S.document().schemaType("homePage").documentId("homePage")),
            S.listItem()
              .title("Site settings")
              .id("siteSettings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            S.documentTypeListItem("product").title("Product stories"),
            S.documentTypeListItem("categoryEditorial").title("Category banners"),
            S.divider(),
            S.listItem()
              .title("Pages")
              .id("pages")
              .child(
                S.list()
                  .title("Pages")
                  .items(
                    contentPages.map(({ slug, title }) =>
                      S.listItem()
                        .title(title)
                        .id(pageDocumentId(slug))
                        .child(
                          S.document()
                            .schemaType("page")
                            .documentId(pageDocumentId(slug))
                            .title(title)
                        )
                    )
                  )
              ),
            S.documentTypeListItem("faq").title("FAQs"),
            S.documentTypeListItem("post").title("Journal"),
          ]),
    }),
  ],
  apiVersion,
})
