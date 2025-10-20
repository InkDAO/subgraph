import { Transfer as TransferEvent } from "../generated/templates/dXasset/dXasset"
import { Purchase, Holder, Asset } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"
import { loadOrCreateAsset, loadOrCreateHolder, loadOrCreatePurchase } from "./utils/entityUtils"

export function handleTransfer(event: TransferEvent): void {
  // Skip minting events (from 0x0)
  if (event.params.from.toHexString() == "0x0000000000000000000000000000000000000000") {
    return
  }
  
  // Skip burning events (to 0x0)
  if (event.params.to.toHexString() == "0x0000000000000000000000000000000000000000") {
    return
  }
  
  let asset = loadOrCreateAsset(event.address)
  // delete the from holder and add to the to holder
  let fromPurchaseId = event.params.from.toHexString().concat("-").concat(asset.id.toHexString())
  let fromPurchase: Purchase = loadOrCreatePurchase(fromPurchaseId)
  fromPurchase.balance = fromPurchase.balance.minus(event.params.value)
  fromPurchase.save()

  let toPurchaseId = event.params.to.toHexString().concat("-").concat(asset.id.toHexString())
  let toPurchase: Purchase = loadOrCreatePurchase(toPurchaseId)
  toPurchase.balance = toPurchase.balance.plus(event.params.value)
  toPurchase.holder = event.params.to
  toPurchase.asset = asset.id
  toPurchase.save()
}

