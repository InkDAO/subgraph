import { Bytes, BigInt } from "@graphprotocol/graph-ts"
import { Asset, Creator, Holder, GlobalStats, Purchase } from "../../generated/schema"
import { BIGINT_ZERO, BYTES_ZERO } from "../constants"

export function loadOrCreateAsset(id: Bytes): Asset {
  let asset = Asset.load(id)
  if (asset == null) {
    asset = new Asset(id)
    asset.creator = BYTES_ZERO
    asset.contentCid = ""
    asset.title = ""
    asset.thumbnailCid = ""
    asset.priceInWei = BIGINT_ZERO
    asset.createdAt = BIGINT_ZERO
    asset.save()
  }
  return asset
}

export function loadOrCreateCreator(id: Bytes): Creator {
  let creator = Creator.load(id)
  if (creator == null) {
    creator = new Creator(id)
    creator.totalAssets = BIGINT_ZERO
    creator.totalEarnings = BIGINT_ZERO
    creator.save()
  }
  return creator
}

export function loadOrCreateHolder(id: Bytes): Holder {
  let holder = Holder.load(id)
  if (holder == null) {
    holder = new Holder(id)
    holder.totalPurchases = BIGINT_ZERO
    holder.totalSpent = BIGINT_ZERO
    holder.save()
  }
  return holder
}

export function loadOrCreatePurchase(id: string): Purchase {
  let purchase = Purchase.load(id)
  if (purchase == null) {
    purchase = new Purchase(id)
    purchase.asset = BYTES_ZERO
    purchase.holder = BYTES_ZERO
    purchase.balance = BIGINT_ZERO
    purchase.amountPaid = BIGINT_ZERO
    purchase.purchasedAt = BIGINT_ZERO
    purchase.save()
  }
  return purchase
}

export function loadOrCreateGlobalStats(id: Bytes): GlobalStats {
  let stats = GlobalStats.load(id)
  if (stats == null) {
    stats = new GlobalStats(id)
    stats.totalAssets = BIGINT_ZERO
    stats.totalCreators = BIGINT_ZERO
    stats.totalHolders = BIGINT_ZERO
    stats.totalUsers = BIGINT_ZERO
    stats.totalPurchases = BIGINT_ZERO
    stats.totalVolume = BIGINT_ZERO
    stats.totalRevenue = BIGINT_ZERO
    stats.totalAssetWorth = BIGINT_ZERO
    stats.save()
  }
  return stats
}