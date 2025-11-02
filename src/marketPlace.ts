import {
  PostCreated as PostCreatedEvent,
  PostSubscribed as PostSubscribedEvent
} from "../generated/marketPlace/marketPlace"
import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Creator, Holder, GlobalStats, Asset } from "../generated/schema"
import { BIGINT_ZERO, BIGINT_ONE, BYTES_ZERO, PLATFORM_FEE_PERCENTAGE } from "./constants"
import { loadOrCreateAsset, loadOrCreateCreator, loadOrCreateHolder, loadOrCreateGlobalStats } from "./utils/entityUtils"

export function handlePostCreated(event: PostCreatedEvent): void {
  updateUserStats(Bytes.fromHexString(event.params.author.toHexString()), true)

  let assetId = Bytes.fromByteArray(Bytes.fromBigInt(event.params.tokenId))
  let asset = loadOrCreateAsset(assetId)
  
  asset.contentCid = event.params.postCid
  asset.title = event.params.postTitle
  asset.thumbnailCid = event.params.thumbnailCid
  asset.priceInWei = event.params.costInNativeInWei
  asset.createdAt = event.block.timestamp
  
  // Get or create Creator
  let creatorId = Bytes.fromHexString(event.params.author.toHexString())
  let creator = loadOrCreateCreator(creatorId)
  creator.totalAssets = creator.totalAssets.plus(BIGINT_ONE)
  creator.totalAssetWorth = creator.totalAssetWorth.plus(asset.priceInWei)
  creator.save()
  
  asset.creator = creator.id
  asset.save()
  
  updateGlobalStats(BIGINT_ONE, BIGINT_ZERO, BIGINT_ZERO, BIGINT_ZERO, asset.priceInWei)
}

export function handlePostSubscribed(event: PostSubscribedEvent): void {
  updateUserStats(Bytes.fromHexString(event.params.subscriber.toHexString()), false)

  let assetId = Bytes.fromByteArray(Bytes.fromBigInt(event.params.tokenId))
  let asset: Asset = loadOrCreateAsset(assetId)
  asset.totalSubscriber = asset.totalSubscriber.plus(BIGINT_ONE)
  asset.save()

  let creatorId = Bytes.fromHexString(asset.creator.toHexString())
  let creator: Creator = loadOrCreateCreator(creatorId)
  creator.totalSubscribers = creator.totalSubscribers.plus(BIGINT_ONE)
  creator.totalEarnings = creator.totalEarnings.plus(event.params.totalCost)
  creator.save()

  let holderId = Bytes.fromHexString(event.params.subscriber.toHexString())
  let holder = loadOrCreateHolder(holderId)
  holder.totalPurchases = holder.totalPurchases.plus(BIGINT_ONE)
  holder.totalSpent = holder.totalSpent.plus(event.params.totalCost)
  holder.asset = asset.id
  holder.save()
  
  updateGlobalStats(BIGINT_ZERO, BIGINT_ONE, event.params.totalCost, event.params.totalCost.times(PLATFORM_FEE_PERCENTAGE).div(BigInt.fromI32(100)), BIGINT_ZERO)
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
