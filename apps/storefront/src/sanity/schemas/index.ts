import {
  categoryEditorial,
  faq,
  homePage,
  page,
  post,
  product,
  siteSettings,
} from "./documents"
import { imageWithAlt, richText, seo } from "./shared"

export const schemaTypes = [
  richText,
  seo,
  imageWithAlt,
  siteSettings,
  homePage,
  product,
  categoryEditorial,
  page,
  faq,
  post,
]

/**
 * Fixed documents edited from the Studio sidebar; editors can't create or
 * delete them. `page` has one document per entry in `contentPages`.
 */
export const singletonTypes = new Set(["siteSettings", "homePage", "page"])
