import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Asset, Creator, Holder, Purchase, GlobalStats } from "../generated/schema"
import { handleAssetAdded, handleAssetBought } from "../src/dXmaster"
import { createAssetAddedEvent, createAssetBoughtEvent } from "./utils"

describe("dXmaster - Asset and Purchase Tests", () => {
  beforeEach(() => {
    clearStore()
  })

  afterEach(() => {
    clearStore()
  })

  describe("handleAssetAdded", () => {
    test("Should create Asset entity with correct fields", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let assetTitle = "Test Asset"
      let assetCid = "QmTestCID123"
      let thumbnailCid = "QmThumbnail123"
      let costInWei = BigInt.fromI32(1000000)

      let assetAddedEvent = createAssetAddedEvent(
        assetAddress,
        assetTitle,
        assetCid,
        thumbnailCid,
        author,
        costInWei
      )

      handleAssetAdded(assetAddedEvent)

      let assetId = Bytes.fromHexString(assetAddress.toHexString())
      assert.entityCount("Asset", 1)
      assert.fieldEquals("Asset", assetId.toHexString(), "title", assetTitle)
      assert.fieldEquals("Asset", assetId.toHexString(), "contentCid", assetCid)
      assert.fieldEquals("Asset", assetId.toHexString(), "thumbnailCid", thumbnailCid)
      assert.fieldEquals("Asset", assetId.toHexString(), "priceInWei", costInWei.toString())
      assert.fieldEquals("Asset", assetId.toHexString(), "creator", author.toHexString())
    })

    test("Should create Creator entity and increment totalAssets", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let author = Address.fromString("0x0000000000000000000000000000000000000002")

      let assetAddedEvent = createAssetAddedEvent(
        assetAddress,
        "Test Asset",
        "QmTest",
        "QmThumb",
        author,
        BigInt.fromI32(1000)
      )

      handleAssetAdded(assetAddedEvent)

      assert.entityCount("Creator", 1)
      assert.fieldEquals("Creator", author.toHexString(), "totalAssets", "1")
      assert.fieldEquals("Creator", author.toHexString(), "totalEarnings", "0")
    })

    test("Should increment Creator totalAssets for existing creator", () => {
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let asset1 = Address.fromString("0x0000000000000000000000000000000000000001")
      let asset2 = Address.fromString("0x0000000000000000000000000000000000000003")

      // Create first asset
      let event1 = createAssetAddedEvent(asset1, "Asset 1", "QmTest1", "QmThumb1", author, BigInt.fromI32(1000))
      handleAssetAdded(event1)

      // Create second asset
      let event2 = createAssetAddedEvent(asset2, "Asset 2", "QmTest2", "QmThumb2", author, BigInt.fromI32(2000))
      handleAssetAdded(event2)

      assert.entityCount("Creator", 1)
      assert.entityCount("Asset", 2)
      assert.fieldEquals("Creator", author.toHexString(), "totalAssets", "2")
    })

    test("Should update GlobalStats correctly", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let priceInWei = BigInt.fromI32(1000000)

      let event = createAssetAddedEvent(
        assetAddress,
        "Test Asset",
        "QmTest",
        "QmThumb",
        author,
        priceInWei
      )

      handleAssetAdded(event)

      let statsId = Bytes.fromI32(0).toHexString()
      assert.entityCount("GlobalStats", 1)
      assert.fieldEquals("GlobalStats", statsId, "totalAssets", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalCreators", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalUsers", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalAssetWorth", priceInWei.toString())
      assert.fieldEquals("GlobalStats", statsId, "totalPurchases", "0")
      assert.fieldEquals("GlobalStats", statsId, "totalVolume", "0")
    })
  })

  describe("handleAssetBought", () => {
    test("Should create Purchase entity with correct fields", () => {
      // First create an asset
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer = Address.fromString("0x0000000000000000000000000000000000000003")
      let priceInWei = BigInt.fromI32(1000)
      let amount = BigInt.fromI32(5)

      let assetEvent = createAssetAddedEvent(
        assetAddress,
        "Test Asset",
        "QmTest",
        "QmThumb",
        author,
        priceInWei
      )
      handleAssetAdded(assetEvent)

      // Now buy the asset
      let buyEvent = createAssetBoughtEvent(assetAddress, amount, buyer)
      handleAssetBought(buyEvent)

      let purchaseId = buyer.toHexString().concat("-").concat(assetAddress.toHexString())
      let expectedTotal = amount.times(priceInWei)

      assert.entityCount("Purchase", 1)
      assert.fieldEquals("Purchase", purchaseId, "balance", amount.toString())
      assert.fieldEquals("Purchase", purchaseId, "amountPaid", expectedTotal.toString())
      assert.fieldEquals("Purchase", purchaseId, "holder", buyer.toHexString())
      assert.fieldEquals("Purchase", purchaseId, "asset", assetAddress.toHexString())
    })

    test("Should create Holder entity and update stats", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer = Address.fromString("0x0000000000000000000000000000000000000003")
      let priceInWei = BigInt.fromI32(1000)
      let amount = BigInt.fromI32(5)

      let assetEvent = createAssetAddedEvent(assetAddress, "Test Asset", "QmTest", "QmThumb", author, priceInWei)
      handleAssetAdded(assetEvent)

      let buyEvent = createAssetBoughtEvent(assetAddress, amount, buyer)
      handleAssetBought(buyEvent)

      let expectedSpent = amount.times(priceInWei)

      assert.entityCount("Holder", 1)
      assert.fieldEquals("Holder", buyer.toHexString(), "totalPurchases", "1")
      assert.fieldEquals("Holder", buyer.toHexString(), "totalSpent", expectedSpent.toString())
    })

    test("Should increment Holder stats for multiple purchases", () => {
      let asset1 = Address.fromString("0x0000000000000000000000000000000000000001")
      let asset2 = Address.fromString("0x0000000000000000000000000000000000000004")
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer = Address.fromString("0x0000000000000000000000000000000000000003")
      let price1 = BigInt.fromI32(1000)
      let price2 = BigInt.fromI32(2000)
      let amount1 = BigInt.fromI32(5)
      let amount2 = BigInt.fromI32(3)

      // Create assets
      handleAssetAdded(createAssetAddedEvent(asset1, "Asset 1", "QmTest1", "QmThumb1", author, price1))
      handleAssetAdded(createAssetAddedEvent(asset2, "Asset 2", "QmTest2", "QmThumb2", author, price2))

      // Buy both assets
      handleAssetBought(createAssetBoughtEvent(asset1, amount1, buyer))
      handleAssetBought(createAssetBoughtEvent(asset2, amount2, buyer))

      let expectedSpent = amount1.times(price1).plus(amount2.times(price2))

      assert.entityCount("Holder", 1)
      assert.entityCount("Purchase", 2)
      assert.fieldEquals("Holder", buyer.toHexString(), "totalPurchases", "2")
      assert.fieldEquals("Holder", buyer.toHexString(), "totalSpent", expectedSpent.toString())
    })

    test("Should update GlobalStats with purchase data", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer = Address.fromString("0x0000000000000000000000000000000000000003")
      let priceInWei = BigInt.fromI32(1000)
      let amount = BigInt.fromI32(10)
      let platformFee = BigInt.fromI32(5) // 5% fee

      handleAssetAdded(createAssetAddedEvent(assetAddress, "Test Asset", "QmTest", "QmThumb", author, priceInWei))
      handleAssetBought(createAssetBoughtEvent(assetAddress, amount, buyer))

      let totalVolume = amount.times(priceInWei)
      let expectedRevenue = totalVolume.times(platformFee).div(BigInt.fromI32(100))
      let statsId = Bytes.fromI32(0).toHexString()

      assert.fieldEquals("GlobalStats", statsId, "totalPurchases", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalVolume", totalVolume.toString())
      assert.fieldEquals("GlobalStats", statsId, "totalRevenue", expectedRevenue.toString())
      assert.fieldEquals("GlobalStats", statsId, "totalHolders", "1")
    })

    test("Should track unique users correctly", () => {
      let asset1 = Address.fromString("0x0000000000000000000000000000000000000001")
      let creator1 = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer1 = Address.fromString("0x0000000000000000000000000000000000000003")

      handleAssetAdded(createAssetAddedEvent(asset1, "Asset 1", "QmTest1", "QmThumb1", creator1, BigInt.fromI32(1000)))
      handleAssetBought(createAssetBoughtEvent(asset1, BigInt.fromI32(5), buyer1))

      let statsId = Bytes.fromI32(0).toHexString()
      
      // Should have 2 unique users (1 creator, 1 holder)
      assert.fieldEquals("GlobalStats", statsId, "totalUsers", "2")
      assert.fieldEquals("GlobalStats", statsId, "totalCreators", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalHolders", "1")
    })

    test("Should not double count user who is both creator and holder", () => {
      let asset1 = Address.fromString("0x0000000000000000000000000000000000000001")
      let asset2 = Address.fromString("0x0000000000000000000000000000000000000004")
      let user = Address.fromString("0x0000000000000000000000000000000000000002")

      // User creates an asset
      handleAssetAdded(createAssetAddedEvent(asset1, "Asset 1", "QmTest1", "QmThumb1", user, BigInt.fromI32(1000)))
      
      // Create another asset by different creator
      let creator2 = Address.fromString("0x0000000000000000000000000000000000000005")
      handleAssetAdded(createAssetAddedEvent(asset2, "Asset 2", "QmTest2", "QmThumb2", creator2, BigInt.fromI32(2000)))
      
      // Same user buys an asset
      handleAssetBought(createAssetBoughtEvent(asset2, BigInt.fromI32(3), user))

      let statsId = Bytes.fromI32(0).toHexString()
      
      // Should have 2 unique users (user who is both creator and holder, and creator2)
      assert.fieldEquals("GlobalStats", statsId, "totalUsers", "2")
      assert.fieldEquals("GlobalStats", statsId, "totalCreators", "2")
      assert.fieldEquals("GlobalStats", statsId, "totalHolders", "1")
    })
  })

  describe("Complex scenarios", () => {
    test("Should handle multiple assets and purchases correctly", () => {
      let creator1 = Address.fromString("0x0000000000000000000000000000000000000001")
      let creator2 = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer1 = Address.fromString("0x0000000000000000000000000000000000000003")
      let buyer2 = Address.fromString("0x0000000000000000000000000000000000000004")

      let asset1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let asset2 = Address.fromString("0x0000000000000000000000000000000000000012")
      let asset3 = Address.fromString("0x0000000000000000000000000000000000000013")

      // Create 3 assets
      handleAssetAdded(createAssetAddedEvent(asset1, "Asset 1", "Qm1", "Qt1", creator1, BigInt.fromI32(100)))
      handleAssetAdded(createAssetAddedEvent(asset2, "Asset 2", "Qm2", "Qt2", creator1, BigInt.fromI32(200)))
      handleAssetAdded(createAssetAddedEvent(asset3, "Asset 3", "Qm3", "Qt3", creator2, BigInt.fromI32(300)))

      // Make purchases
      handleAssetBought(createAssetBoughtEvent(asset1, BigInt.fromI32(2), buyer1))
      handleAssetBought(createAssetBoughtEvent(asset2, BigInt.fromI32(3), buyer1))
      handleAssetBought(createAssetBoughtEvent(asset3, BigInt.fromI32(1), buyer2))

      let statsId = Bytes.fromI32(0).toHexString()

      // Verify counts
      assert.entityCount("Asset", 3)
      assert.entityCount("Creator", 2)
      assert.entityCount("Holder", 2)
      assert.entityCount("Purchase", 3)

      // Verify creator1 stats
      assert.fieldEquals("Creator", creator1.toHexString(), "totalAssets", "2")

      // Verify creator2 stats
      assert.fieldEquals("Creator", creator2.toHexString(), "totalAssets", "1")

      // Verify buyer1 stats
      let buyer1Spent = BigInt.fromI32(2).times(BigInt.fromI32(100))
        .plus(BigInt.fromI32(3).times(BigInt.fromI32(200)))
      assert.fieldEquals("Holder", buyer1.toHexString(), "totalPurchases", "2")
      assert.fieldEquals("Holder", buyer1.toHexString(), "totalSpent", buyer1Spent.toString())

      // Verify global stats
      assert.fieldEquals("GlobalStats", statsId, "totalAssets", "3")
      assert.fieldEquals("GlobalStats", statsId, "totalPurchases", "3")
      assert.fieldEquals("GlobalStats", statsId, "totalUsers", "4")
    })
  })
})
