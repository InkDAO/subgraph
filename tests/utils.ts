import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import { AssetAdded as AssetAddedEvent, AssetBought as AssetBoughtEvent } from "../generated/dXmaster/dXmaster"
import { Transfer as TransferEvent } from "../generated/templates/dXasset/dXasset"

export function createAssetAddedEvent(
  assetAddress: Address,
  assetTitle: string,
  assetCid: string,
  thumbnailCid: string,
  author: Address,
  costInNativeInWei: BigInt
): AssetAddedEvent {
  let assetAddedEvent = changetype<AssetAddedEvent>(newMockEvent())

  assetAddedEvent.parameters = new Array()

  // Must match ABI order: title, cid, thumbnail, address, author, cost
  assetAddedEvent.parameters.push(
    new ethereum.EventParam("_assetTitle", ethereum.Value.fromString(assetTitle))
  )
  assetAddedEvent.parameters.push(
    new ethereum.EventParam("_assetCid", ethereum.Value.fromString(assetCid))
  )
  assetAddedEvent.parameters.push(
    new ethereum.EventParam("_thumbnailCid", ethereum.Value.fromString(thumbnailCid))
  )
  assetAddedEvent.parameters.push(
    new ethereum.EventParam("_assetAddress", ethereum.Value.fromAddress(assetAddress))
  )
  assetAddedEvent.parameters.push(
    new ethereum.EventParam("_author", ethereum.Value.fromAddress(author))
  )
  assetAddedEvent.parameters.push(
    new ethereum.EventParam("_costInNativeInWei", ethereum.Value.fromUnsignedBigInt(costInNativeInWei))
  )

  return assetAddedEvent
}

export function createAssetBoughtEvent(
  assetAddress: Address,
  amount: BigInt,
  buyer: Address
): AssetBoughtEvent {
  let assetBoughtEvent = changetype<AssetBoughtEvent>(newMockEvent())

  assetBoughtEvent.parameters = new Array()

  assetBoughtEvent.parameters.push(
    new ethereum.EventParam("_assetAddress", ethereum.Value.fromAddress(assetAddress))
  )
  assetBoughtEvent.parameters.push(
    new ethereum.EventParam("_amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  assetBoughtEvent.parameters.push(
    new ethereum.EventParam("_buyer", ethereum.Value.fromAddress(buyer))
  )

  return assetBoughtEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): TransferEvent {
  let transferEvent = changetype<TransferEvent>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}