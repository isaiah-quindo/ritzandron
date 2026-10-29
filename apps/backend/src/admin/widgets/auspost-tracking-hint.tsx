import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"

const AusPostTrackingHint = () => {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Australia Post dispatch</Heading>
      </div>
      <div className="flex flex-col gap-y-2 px-6 py-4">
        <Text size="small" leading="compact">
          1. Under Unfulfilled items, choose <b>Fulfill items</b> once the parcel
          is packed.
        </Text>
        <Text size="small" leading="compact">
          2. On the fulfillment, choose <b>Mark as shipped</b> and paste the
          AusPost tracking number (e.g. 33ABC1234567).
        </Text>
        <Text size="small" leading="compact">
          3. The customer is emailed automatically with a link to
          auspost.com.au/mypost/track. Leave the tracking URL blank unless you
          used a different courier.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default AusPostTrackingHint
