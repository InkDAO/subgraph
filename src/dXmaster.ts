import {
  AssetAdded as AssetAddedEvent,
  AssetBought as AssetBoughtEvent
} from "../generated/dXmaster/dXmaster"
import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Creator, Holder, GlobalStats, Asset } from "../generated/schema"
import { BIGINT_ZERO, BIGINT_ONE, BYTES_ZERO, PLATFORM_FEE_PERCENTAGE } from "./constants"
import { loadOrCreateAsset, loadOrCreateCreator, loadOrCreateHolder, loadOrCreatePurchase, loadOrCreateGlobalStats } from "./utils/entityUtils"

export function handleAssetAdded(event: AssetAddedEvent): void {
  updateUserStats(Bytes.fromHexString(event.params._author.toHexString()), true)

  // Create data source template for the asset contract
  // Note: This doesn't work in Matchstick test environment
  // dXasset.create(event.params._assetAddress)

  let assetId = Bytes.fromHexString(event.params._assetAddress.toHexString())
  let asset = loadOrCreateAsset(assetId)
  
  asset.contentCid = event.params._assetCid
  asset.title = event.params._assetTitle
  asset.thumbnailCid = event.params._thumbnailCid
  asset.priceInWei = event.params._costInNativeInWei
  asset.createdAt = event.block.timestamp
  
  // Get or create Creator
  let creatorId = Bytes.fromHexString(event.params._author.toHexString())
  let creator = loadOrCreateCreator(creatorId)
  creator.totalAssets = creator.totalAssets.plus(BIGINT_ONE)
  creator.save()
  
  asset.creator = creator.id
  asset.save()
  
  updateGlobalStats(BIGINT_ONE, BIGINT_ZERO, BIGINT_ZERO, BIGINT_ZERO, asset.priceInWei)
}

export function handleAssetBought(event: AssetBoughtEvent): void {
  updateUserStats(Bytes.fromHexString(event.params._buyer.toHexString()), false)

  let assetId = Bytes.fromHexString(event.params._assetAddress.toHexString())
  let asset: Asset = loadOrCreateAsset(assetId)

  let holderId = Bytes.fromHexString(event.params._buyer.toHexString())
  let holder = loadOrCreateHolder(holderId)
  holder.totalPurchases = holder.totalPurchases.plus(BIGINT_ONE)
  holder.totalSpent = holder.totalSpent.plus(event.params._amount.times(asset.priceInWei))
  holder.save()
  
  let purchaseId = event.params._buyer.toHexString().concat("-").concat(event.params._assetAddress.toHexString())
  let purchase = loadOrCreatePurchase(purchaseId)
  purchase.balance = event.params._amount
  purchase.amountPaid = event.params._amount.times(asset.priceInWei)
  purchase.purchasedAt = event.block.timestamp
  purchase.holder = holder.id
  purchase.asset = assetId
  purchase.save()
  
  updateGlobalStats(BIGINT_ZERO, BIGINT_ONE, event.params._amount.times(asset.priceInWei), event.params._amount.times(asset.priceInWei).times(PLATFORM_FEE_PERCENTAGE).div(BigInt.fromI32(100)), BIGINT_ZERO)
}

function updateGlobalStats(
  assetsIncrement: BigInt,
  purchasesIncrement: BigInt, 
  volumeIncrement: BigInt,
  revenueIncrement: BigInt,
  assetWorthIncrement: BigInt
): void {
  let stats: GlobalStats = loadOrCreateGlobalStats(BYTES_ZERO)
  
  stats.totalAssets = stats.totalAssets.plus(assetsIncrement)
  stats.totalPurchases = stats.totalPurchases.plus(purchasesIncrement)
  stats.totalVolume = stats.totalVolume.plus(volumeIncrement)
  stats.totalRevenue = stats.totalRevenue.plus(revenueIncrement)
  stats.totalAssetWorth = stats.totalAssetWorth.plus(assetWorthIncrement)

  stats.save()
}

function updateUserStats(
  userAddress: Bytes,
  isCreator: boolean
): void {
  let creator = Creator.load(userAddress)
  let holder = Holder.load(userAddress)
  let stats: GlobalStats = loadOrCreateGlobalStats(BYTES_ZERO)
  
  if (creator == null && holder == null) {
    stats.totalUsers = stats.totalUsers.plus(BIGINT_ONE)
  }
  
  if (isCreator && creator == null) {
    creator = loadOrCreateCreator(userAddress)
    stats.totalCreators = stats.totalCreators.plus(BIGINT_ONE)
  }
  
  if (!isCreator && holder == null) {
    holder = loadOrCreateHolder(userAddress)
    stats.totalHolders = stats.totalHolders.plus(BIGINT_ONE)
  }
  
  stats.save()
}
