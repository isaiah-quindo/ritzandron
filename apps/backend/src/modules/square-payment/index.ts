import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import SquarePaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [SquarePaymentProviderService],
})
