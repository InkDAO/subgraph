import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { handlePostCreated, handlePostSubscribed } from "../src/marketPlace"
import { createPostCreatedEvent, createPostSubscribedEvent } from "./marketPlace-utils"
import { PLATFORM_FEE_PERCENTAGE } from "../src/constants"

describe("marketPlace - Post and Subscription Tests", () => {
  beforeEach(() => {
    clearStore()
  })

  afterEach(() => {
    clearStore()
  })

  describe("handlePostCreated", () => {
    test("Should create Asset entity with correct fields", () => {
      let tokenId = BigInt.fromI32(1)
      let postTitle = "Test Post"
      let postCid = "QmTestCID123"
      let thumbnailCid = "QmThumbnail123"
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let costInNativeInWei = BigInt.fromI32(1000000)

      let postCreatedEvent = createPostCreatedEvent(
        tokenId,
        postTitle,
        postCid,
        thumbnailCid,
        author,
        costInNativeInWei
      )

      handlePostCreated(postCreatedEvent)

      let assetId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId))
      assert.entityCount("Asset", 1)
      assert.fieldEquals("Asset", assetId.toHexString(), "title", postTitle)
      assert.fieldEquals("Asset", assetId.toHexString(), "contentCid", postCid)
      assert.fieldEquals("Asset", assetId.toHexString(), "thumbnailCid", thumbnailCid)
      assert.fieldEquals("Asset", assetId.toHexString(), "priceInWei", costInNativeInWei.toString())
      assert.fieldEquals("Asset", assetId.toHexString(), "creator", author.toHexString())
    })

    test("Should create Creator entity and increment totalAssets", () => {
      let tokenId = BigInt.fromI32(1)
      let author = Address.fromString("0x0000000000000000000000000000000000000002")

      let postCreatedEvent = createPostCreatedEvent(
        tokenId,
        "Test Post",
        "QmTestCID123",
        "QmThumbnail123",
        author,
        BigInt.fromI32(1000000)
      )

      handlePostCreated(postCreatedEvent)

      assert.entityCount("Creator", 1)
      assert.fieldEquals("Creator", author.toHexString(), "totalAssets", "1")
      assert.fieldEquals("Creator", author.toHexString(), "totalEarnings", "0")
    })

    test("Should increment Creator totalAssets for existing creator", () => {
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let tokenId1 = BigInt.fromI32(1)
      let tokenId2 = BigInt.fromI32(2)
      let tokenId3 = BigInt.fromI32(3)

      // Create first asset
      let event1 = createPostCreatedEvent(tokenId1, "Post 1", "QmTest1", "QmThumb1", author, BigInt.fromI32(1000000))
      handlePostCreated(event1)

      // Create second asset
      let event2 = createPostCreatedEvent(tokenId2, "Post 2", "QmTest2", "QmThumb2", author, BigInt.fromI32(2000000))
      handlePostCreated(event2)

      assert.entityCount("Creator", 1)
      assert.fieldEquals("Creator", author.toHexString(), "totalAssets", "2")

      // Create third asset
      let event3 = createPostCreatedEvent(
        tokenId3,
        "Test Post",
        "QmTestCID123",
        "QmThumbnail123",
        author,
        BigInt.fromI32(3000000)
      )

      handlePostCreated(event3)

      let statsId = Bytes.fromI32(0).toHexString()
      assert.entityCount("GlobalStats", 1)
      assert.entityCount("Creator", 1)
      assert.fieldEquals("Creator", author.toHexString(), "totalAssets", "3")
      assert.fieldEquals("GlobalStats", statsId, "totalAssets", "3")
      assert.fieldEquals("GlobalStats", statsId, "totalCreators", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalUsers", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalAssetWorth", BigInt.fromI32(6000000).toString())
      assert.fieldEquals("GlobalStats", statsId, "totalPurchases", "0")
      assert.fieldEquals("GlobalStats", statsId, "totalVolume", "0")
    })
  })

  describe("handlePostSubscribed", () => {
    test("Should create Holder entity and update creator earnings", () => {
      // First create an asset
      let tokenId = BigInt.fromI32(1)
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer = Address.fromString("0x0000000000000000000000000000000000000003")
      let priceInWei = BigInt.fromI32(1000000)

      let postCreatedEvent = createPostCreatedEvent(
        tokenId,
        "Test Post",
        "QmTestCID123",
        "QmThumbnail123",
        author,
        priceInWei
      )
      handlePostCreated(postCreatedEvent)

      // Subscribe to the post
      handlePostSubscribed(createPostSubscribedEvent(tokenId, buyer, priceInWei))

      assert.entityCount("Holder", 1)
      assert.fieldEquals("Holder", buyer.toHexString(), "totalPurchases", "1")
      assert.fieldEquals("Holder", buyer.toHexString(), "totalSpent", priceInWei.toString())
      assert.fieldEquals("Creator", author.toHexString(), "totalEarnings", priceInWei.toString())
    })

    test("Should create Holder entity and update stats", () => {
      let tokenId = BigInt.fromI32(1)
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer = Address.fromString("0x0000000000000000000000000000000000000003")
      let priceInWei = BigInt.fromI32(1000000)

      let postCreatedEvent = createPostCreatedEvent(tokenId, "Test Post", "QmTestCID123", "QmThumbnail123", author, priceInWei)
      handlePostCreated(postCreatedEvent)

      handlePostSubscribed(createPostSubscribedEvent(tokenId, buyer, priceInWei))

      assert.entityCount("Holder", 1)
      assert.fieldEquals("Holder", buyer.toHexString(), "totalPurchases", "1")
      assert.fieldEquals("Holder", buyer.toHexString(), "totalSpent", priceInWei.toString())
      
      let statsId = Bytes.fromI32(0).toHexString()
      assert.fieldEquals("GlobalStats", statsId, "totalHolders", "1")
    })

    test("Should increment Holder stats for multiple purchases", () => {
      let tokenId1 = BigInt.fromI32(1)
      let tokenId2 = BigInt.fromI32(2)
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer = Address.fromString("0x0000000000000000000000000000000000000003")
      let price1 = BigInt.fromI32(1000000)
      let price2 = BigInt.fromI32(2000000)

      // Create assets
      handlePostCreated(createPostCreatedEvent(tokenId1, "Post 1", "QmTest1", "QmThumb1", author, price1))
      handlePostCreated(createPostCreatedEvent(tokenId2, "Post 2", "QmTest2", "QmThumb2", author, price2))

      // Buy both assets
      handlePostSubscribed(createPostSubscribedEvent(tokenId1, buyer, price1))
      handlePostSubscribed(createPostSubscribedEvent(tokenId2, buyer, price2))

      assert.entityCount("Holder", 1)
      assert.fieldEquals("Holder", buyer.toHexString(), "totalPurchases", "2")
      assert.fieldEquals("Holder", buyer.toHexString(), "totalSpent", price1.plus(price2).toString())
      assert.fieldEquals("Creator", author.toHexString(), "totalEarnings", price1.plus(price2).toString())
    })

    test("Should update GlobalStats with purchase data", () => {
      let tokenId = BigInt.fromI32(1)
      let author = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer = Address.fromString("0x0000000000000000000000000000000000000003")
      let priceInWei = BigInt.fromI32(1000000)

      handlePostCreated(createPostCreatedEvent(tokenId, "Test Post", "QmTestCID123", "QmThumbnail123", author, BigInt.fromI32(1000000)))
      handlePostSubscribed(createPostSubscribedEvent(tokenId, buyer, BigInt.fromI32(1000000)))

      let statsId = Bytes.fromI32(0).toHexString()
      assert.fieldEquals("GlobalStats", statsId, "totalPurchases", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalVolume", BigInt.fromI32(1000000).toString())
      assert.fieldEquals("GlobalStats", statsId, "totalRevenue", BigInt.fromI32(1000000).times(PLATFORM_FEE_PERCENTAGE).div(BigInt.fromI32(100)).toString())
      assert.fieldEquals("GlobalStats", statsId, "totalHolders", "1")
    })

    test("Should track unique users correctly", () => {
      let tokenId = BigInt.fromI32(1)
      let creator1 = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer1 = Address.fromString("0x0000000000000000000000000000000000000003")

      handlePostCreated(createPostCreatedEvent(tokenId, "Post 1", "QmTest1", "QmThumb1", creator1, BigInt.fromI32(1000000)))
      handlePostSubscribed(createPostSubscribedEvent(tokenId, buyer1, BigInt.fromI32(1000000)))

      let statsId = Bytes.fromI32(0).toHexString()
      
      // Should have 2 unique users (1 creator, 1 holder)
      assert.fieldEquals("GlobalStats", statsId, "totalUsers", "2")
      assert.fieldEquals("GlobalStats", statsId, "totalCreators", "1")
      assert.fieldEquals("GlobalStats", statsId, "totalHolders", "1")
    })

    test("Should not double count user who is both creator and holder", () => {
      let tokenId1 = BigInt.fromI32(1)
      let tokenId2 = BigInt.fromI32(2)
      let user = Address.fromString("0x0000000000000000000000000000000000000002")

      // User creates a post
      handlePostCreated(createPostCreatedEvent(tokenId1, "Post 1", "QmTest1", "QmThumb1", user, BigInt.fromI32(1000000)))
      
      // Create another post by different creator
      let creator2 = Address.fromString("0x0000000000000000000000000000000000000005")
      handlePostCreated(createPostCreatedEvent(tokenId2, "Post 2", "QmTest2", "QmThumb2", creator2, BigInt.fromI32(2000000)))
      
      // Same user subscribes to a post
      handlePostSubscribed(createPostSubscribedEvent(tokenId2, user, BigInt.fromI32(2000000)))

      let statsId = Bytes.fromI32(0).toHexString()
      
      // Should have 2 unique users (user who is both creator and holder, and creator2)
      assert.fieldEquals("GlobalStats", statsId, "totalUsers", "2")
      assert.fieldEquals("GlobalStats", statsId, "totalCreators", "2")
      assert.fieldEquals("GlobalStats", statsId, "totalHolders", "1")
    })
  })

  describe("Complex scenarios", () => {
    test("Should handle multiple assets and purchases correctly", () => {
      let tokenId1 = BigInt.fromI32(1)
      let tokenId2 = BigInt.fromI32(2)
      let tokenId3 = BigInt.fromI32(3)
      let creator1 = Address.fromString("0x0000000000000000000000000000000000000001")
      let creator2 = Address.fromString("0x0000000000000000000000000000000000000002")
      let buyer1 = Address.fromString("0x0000000000000000000000000000000000000003")
      let buyer2 = Address.fromString("0x0000000000000000000000000000000000000004")

      // Create 3 assets
      handlePostCreated(createPostCreatedEvent(tokenId1, "Post 1", "QmTest1", "QmThumb1", creator1, BigInt.fromI32(1000000)))
      handlePostCreated(createPostCreatedEvent(tokenId2, "Post 2", "QmTest2", "QmThumb2", creator1, BigInt.fromI32(2000000)))
      handlePostCreated(createPostCreatedEvent(tokenId3, "Post 3", "QmTest3", "QmThumb3", creator2, BigInt.fromI32(3000000)))

      // Make purchases
      handlePostSubscribed(createPostSubscribedEvent(tokenId1, buyer1, BigInt.fromI32(1000000)))
      handlePostSubscribed(createPostSubscribedEvent(tokenId2, buyer1, BigInt.fromI32(2000000)))
      handlePostSubscribed(createPostSubscribedEvent(tokenId3, buyer2, BigInt.fromI32(3000000)))

      let statsId = Bytes.fromI32(0).toHexString()

      // Verify counts
      assert.entityCount("Asset", 3)
      assert.entityCount("Creator", 2)
      assert.entityCount("Holder", 2)

      // Verify creator1 stats
      assert.fieldEquals("Creator", creator1.toHexString(), "totalAssets", "2")

      // Verify creator2 stats
      assert.fieldEquals("Creator", creator2.toHexString(), "totalAssets", "1")

      // Verify buyer1 stats (bought post1 and post2)
      let buyer1Spent = BigInt.fromI32(1000000).plus(BigInt.fromI32(2000000))
      assert.fieldEquals("Holder", buyer1.toHexString(), "totalPurchases", "2")
      assert.fieldEquals("Holder", buyer1.toHexString(), "totalSpent", buyer1Spent.toString())

      // Verify global stats
      assert.fieldEquals("GlobalStats", statsId, "totalAssets", "3")
      assert.fieldEquals("GlobalStats", statsId, "totalPurchases", "3")
      assert.fieldEquals("GlobalStats", statsId, "totalUsers", "4")
    })
  })
})
