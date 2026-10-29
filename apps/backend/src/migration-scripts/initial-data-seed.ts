import { MedusaContainer } from "@medusajs/framework";
import { DEFAULT_REGION_STORE_POLICIES } from "../lib/region-store-policies";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

// Flat Australia Post rates (GST inclusive). Editable later in
// Settings -> Locations & Shipping.
const PARCEL_POST_PRICE = 9.95;
const EXPRESS_POST_PRICE = 14.95;
const FREE_SHIPPING_THRESHOLD = 99;

const SILVER_CHARM_SUBCATEGORIES = [
  "Animals",
  "Birthstones",
  "Hearts & Love",
  "Moon & Stars",
  "Family",
  "Sea Life",
  "Zodiac",
  "Rose Gold",
  "Dangles",
  "Crystals",
];

const TOP_LEVEL_CATEGORIES = [
  "Charm Bracelets",
  "Earrings",
  "Necklaces",
  "Jewellery Sets",
  "Scrunchies",
  "Gift Boxes",
];

const handleize = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  logger.info("Seeding Ritz & Ron store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Online Store",
          description: "ritzandron.com.au",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Storefront",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Ritz & Ron",
          supported_currencies: [
            {
              currency_code: "aud",
              is_default: true,
              is_tax_inclusive: true,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding Australia region...");
  const paymentProviders = ["pp_system_default"];
  if (process.env.SQUARE_ACCESS_TOKEN) {
    paymentProviders.push("pp_square_square");
  }

  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Australia",
          currency_code: "aud",
          countries: ["au"],
          is_tax_inclusive: true,
          payment_providers: paymentProviders,
          metadata: {
            ...DEFAULT_REGION_STORE_POLICIES,
            shipping_rate: PARCEL_POST_PRICE,
            free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
          },
        },
      ],
    },
  });
  const region = regionResult[0];

  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "au",
        provider_id: "tp_system",
        default_tax_rate: {
          name: "GST",
          code: "GST",
          rate: 10,
        },
      },
    ],
  });

  logger.info("Seeding stock location and Australia Post shipping...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Ritz & Ron Studio",
          address: {
            city: "Sydney",
            province: "NSW",
            country_code: "AU",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  // This is created by a migration script in core.
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Australia Post",
    type: "shipping",
    service_zones: [
      {
        name: "Australia",
        geo_zones: [
          {
            country_code: "au",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  const storeRules = [
    {
      attribute: "enabled_in_store",
      value: "true",
      operator: "eq" as const,
    },
    {
      attribute: "is_return",
      value: "false",
      operator: "eq" as const,
    },
  ];

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Australia Post Parcel Post",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "2-7 business days after dispatch. Tracked.",
          code: "auspost-parcel",
        },
        prices: [
          {
            currency_code: "aud",
            amount: PARCEL_POST_PRICE,
          },
          {
            region_id: region.id,
            amount: PARCEL_POST_PRICE,
          },
          {
            region_id: region.id,
            amount: 0,
            rules: [
              {
                attribute: "item_total",
                operator: "gte",
                value: FREE_SHIPPING_THRESHOLD,
              },
            ],
          },
        ],
        rules: storeRules,
      },
      {
        name: "Australia Post Express Post",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "1-3 business days after dispatch. Tracked.",
          code: "auspost-express",
        },
        prices: [
          {
            currency_code: "aud",
            amount: EXPRESS_POST_PRICE,
          },
          {
            region_id: region.id,
            amount: EXPRESS_POST_PRICE,
          },
        ],
        rules: storeRules,
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });

  logger.info("Seeding product categories...");
  const { result: topLevel } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: ["Silver Charms", ...TOP_LEVEL_CATEGORIES].map(
        (name, rank) => ({
          name,
          handle: handleize(name),
          is_active: true,
          rank,
        })
      ),
    },
  });

  const silverCharms = topLevel.find((c) => c.name === "Silver Charms")!;
  await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: SILVER_CHARM_SUBCATEGORIES.map((name, rank) => ({
        name,
        handle: `charms-${handleize(name)}`,
        is_active: true,
        rank,
        parent_category_id: silverCharms.id,
      })),
    },
  });

  logger.info(
    "Finished seeding. Add products in the admin at /app/products."
  );
}
