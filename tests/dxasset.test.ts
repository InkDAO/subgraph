import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Purchase, Holder, Asset } from "../generated/schema"
import { handleTransfer } from "../src/dXasset"
import { createTransferEvent } from "./utils"

describe("dXasset - Transfer Tests", () => {
  beforeEach(() => {
    clearStore()
  })

  afterEach(() => {
    clearStore()
  })

  describe("Minting and Burning", () => {
    test("Should skip minting events (from 0x0)", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let holder1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")
      
      // Create a mock asset
      let asset = new Asset(Bytes.fromHexString(assetAddress.toHexString()))
      asset.creator = Bytes.fromHexString(holder1.toHexString())
      asset.contentCid = "QmTest"
      asset.title = "Test Asset"
      asset.thumbnailCid = "QmThumb"
      asset.priceInWei = BigInt.fromI32(1000)
      asset.createdAt = BigInt.fromI32(1000000)
      asset.save()

      let transferEvent = createTransferEvent(
        zeroAddress,
        holder1,
        BigInt.fromI32(10)
      )
      transferEvent.address = assetAddress

      handleTransfer(transferEvent)

      // No purchases should be created for minting
      let purchaseId = holder1.toHexString().concat("-").concat(assetAddress.toHexString())
      let purchase = Purchase.load(purchaseId)
      
      // Since it's skipped, the purchase should not have been updated
      assert.assertNull(purchase)
    })

    test("Should skip burning events (to 0x0)", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let holder1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")
      
      // Create a mock asset
      let asset = new Asset(Bytes.fromHexString(assetAddress.toHexString()))
      asset.creator = Bytes.fromHexString(holder1.toHexString())
      asset.contentCid = "QmTest"
      asset.title = "Test Asset"
      asset.thumbnailCid = "QmThumb"
      asset.priceInWei = BigInt.fromI32(1000)
      asset.createdAt = BigInt.fromI32(1000000)
      asset.save()

      // First create a purchase for holder1
      let purchaseId = holder1.toHexString().concat("-").concat(assetAddress.toHexString())
      let purchase = new Purchase(purchaseId)
      purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      purchase.holder = Bytes.fromHexString(holder1.toHexString())
      purchase.balance = BigInt.fromI32(10)
      purchase.amountPaid = BigInt.fromI32(10000)
      purchase.purchasedAt = BigInt.fromI32(1000000)
      purchase.save()

      let transferEvent = createTransferEvent(
        holder1,
        zeroAddress,
        BigInt.fromI32(5)
      )
      transferEvent.address = assetAddress

      handleTransfer(transferEvent)

      // Balance should remain unchanged since burning is skipped
      purchase = Purchase.load(purchaseId)!
      assert.fieldEquals("Purchase", purchaseId, "balance", "10")
    })
  })

  describe("Normal Transfers", () => {
    test("Should decrease from holder's balance and increase to holder's balance", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let holder1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let holder2 = Address.fromString("0x0000000000000000000000000000000000000022")
      
      // Create a mock asset
      let asset = new Asset(Bytes.fromHexString(assetAddress.toHexString()))
      asset.creator = Bytes.fromHexString(holder1.toHexString())
      asset.contentCid = "QmTest"
      asset.title = "Test Asset"
      asset.thumbnailCid = "QmThumb"
      asset.priceInWei = BigInt.fromI32(1000)
      asset.createdAt = BigInt.fromI32(1000000)
      asset.save()

      // Setup: Create initial purchase for holder1
      let holder1PurchaseId = holder1.toHexString().concat("-").concat(assetAddress.toHexString())
      let holder1Purchase = new Purchase(holder1PurchaseId)
      holder1Purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      holder1Purchase.holder = Bytes.fromHexString(holder1.toHexString())
      holder1Purchase.balance = BigInt.fromI32(100)
      holder1Purchase.amountPaid = BigInt.fromI32(100000)
      holder1Purchase.purchasedAt = BigInt.fromI32(1000000)
      holder1Purchase.save()

      // Transfer 30 tokens from holder1 to holder2
      let transferEvent = createTransferEvent(
        holder1,
        holder2,
        BigInt.fromI32(30)
      )
      transferEvent.address = assetAddress

      handleTransfer(transferEvent)

      // Check holder1's balance decreased
      assert.fieldEquals("Purchase", holder1PurchaseId, "balance", "70")
      
      // Check holder2's balance increased
      let holder2PurchaseId = holder2.toHexString().concat("-").concat(assetAddress.toHexString())
      assert.fieldEquals("Purchase", holder2PurchaseId, "balance", "30")
      assert.fieldEquals("Purchase", holder2PurchaseId, "holder", holder2.toHexString())
      assert.fieldEquals("Purchase", holder2PurchaseId, "asset", assetAddress.toHexString())
    })

    test("Should handle complete transfer of balance", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let holder1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let holder2 = Address.fromString("0x0000000000000000000000000000000000000022")
      
      // Create a mock asset
      let asset = new Asset(Bytes.fromHexString(assetAddress.toHexString()))
      asset.creator = Bytes.fromHexString(holder1.toHexString())
      asset.contentCid = "QmTest"
      asset.title = "Test Asset"
      asset.thumbnailCid = "QmThumb"
      asset.priceInWei = BigInt.fromI32(1000)
      asset.createdAt = BigInt.fromI32(1000000)
      asset.save()

      // Setup: Create initial purchase for holder1
      let holder1PurchaseId = holder1.toHexString().concat("-").concat(assetAddress.toHexString())
      let holder1Purchase = new Purchase(holder1PurchaseId)
      holder1Purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      holder1Purchase.holder = Bytes.fromHexString(holder1.toHexString())
      holder1Purchase.balance = BigInt.fromI32(50)
      holder1Purchase.amountPaid = BigInt.fromI32(50000)
      holder1Purchase.purchasedAt = BigInt.fromI32(1000000)
      holder1Purchase.save()

      // Transfer all 50 tokens from holder1 to holder2
      let transferEvent = createTransferEvent(
        holder1,
        holder2,
        BigInt.fromI32(50)
      )
      transferEvent.address = assetAddress

      handleTransfer(transferEvent)

      // Check holder1's balance is now zero
      assert.fieldEquals("Purchase", holder1PurchaseId, "balance", "0")
      
      // Check holder2's balance is 50
      let holder2PurchaseId = holder2.toHexString().concat("-").concat(assetAddress.toHexString())
      assert.fieldEquals("Purchase", holder2PurchaseId, "balance", "50")
    })

    test("Should handle multiple transfers between same holders", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let holder1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let holder2 = Address.fromString("0x0000000000000000000000000000000000000022")
      
      // Create a mock asset
      let asset = new Asset(Bytes.fromHexString(assetAddress.toHexString()))
      asset.creator = Bytes.fromHexString(holder1.toHexString())
      asset.contentCid = "QmTest"
      asset.title = "Test Asset"
      asset.thumbnailCid = "QmThumb"
      asset.priceInWei = BigInt.fromI32(1000)
      asset.createdAt = BigInt.fromI32(1000000)
      asset.save()

      // Setup: Create initial purchase for holder1
      let holder1PurchaseId = holder1.toHexString().concat("-").concat(assetAddress.toHexString())
      let holder1Purchase = new Purchase(holder1PurchaseId)
      holder1Purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      holder1Purchase.holder = Bytes.fromHexString(holder1.toHexString())
      holder1Purchase.balance = BigInt.fromI32(100)
      holder1Purchase.amountPaid = BigInt.fromI32(100000)
      holder1Purchase.purchasedAt = BigInt.fromI32(1000000)
      holder1Purchase.save()

      // First transfer: 20 tokens from holder1 to holder2
      let transfer1 = createTransferEvent(holder1, holder2, BigInt.fromI32(20))
      transfer1.address = assetAddress
      handleTransfer(transfer1)

      // Second transfer: 15 tokens from holder1 to holder2
      let transfer2 = createTransferEvent(holder1, holder2, BigInt.fromI32(15))
      transfer2.address = assetAddress
      handleTransfer(transfer2)

      // Check final balances
      assert.fieldEquals("Purchase", holder1PurchaseId, "balance", "65")
      
      let holder2PurchaseId = holder2.toHexString().concat("-").concat(assetAddress.toHexString())
      assert.fieldEquals("Purchase", holder2PurchaseId, "balance", "35")
    })

    test("Should handle transfers between multiple holders", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let holder1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let holder2 = Address.fromString("0x0000000000000000000000000000000000000022")
      let holder3 = Address.fromString("0x0000000000000000000000000000000000000033")
      
      // Create a mock asset
      let asset = new Asset(Bytes.fromHexString(assetAddress.toHexString()))
      asset.creator = Bytes.fromHexString(holder1.toHexString())
      asset.contentCid = "QmTest"
      asset.title = "Test Asset"
      asset.thumbnailCid = "QmThumb"
      asset.priceInWei = BigInt.fromI32(1000)
      asset.createdAt = BigInt.fromI32(1000000)
      asset.save()

      // Setup: Create initial purchases
      let holder1PurchaseId = holder1.toHexString().concat("-").concat(assetAddress.toHexString())
      let holder1Purchase = new Purchase(holder1PurchaseId)
      holder1Purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      holder1Purchase.holder = Bytes.fromHexString(holder1.toHexString())
      holder1Purchase.balance = BigInt.fromI32(100)
      holder1Purchase.amountPaid = BigInt.fromI32(100000)
      holder1Purchase.purchasedAt = BigInt.fromI32(1000000)
      holder1Purchase.save()

      let holder2PurchaseId = holder2.toHexString().concat("-").concat(assetAddress.toHexString())
      let holder2Purchase = new Purchase(holder2PurchaseId)
      holder2Purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      holder2Purchase.holder = Bytes.fromHexString(holder2.toHexString())
      holder2Purchase.balance = BigInt.fromI32(50)
      holder2Purchase.amountPaid = BigInt.fromI32(50000)
      holder2Purchase.purchasedAt = BigInt.fromI32(1000000)
      holder2Purchase.save()

      // Transfer 1: holder1 -> holder2 (30 tokens)
      let transfer1 = createTransferEvent(holder1, holder2, BigInt.fromI32(30))
      transfer1.address = assetAddress
      handleTransfer(transfer1)

      // Transfer 2: holder2 -> holder3 (20 tokens)
      let transfer2 = createTransferEvent(holder2, holder3, BigInt.fromI32(20))
      transfer2.address = assetAddress
      handleTransfer(transfer2)

      // Transfer 3: holder1 -> holder3 (10 tokens)
      let transfer3 = createTransferEvent(holder1, holder3, BigInt.fromI32(10))
      transfer3.address = assetAddress
      handleTransfer(transfer3)

      // Check final balances
      assert.fieldEquals("Purchase", holder1PurchaseId, "balance", "60") // 100 - 30 - 10
      assert.fieldEquals("Purchase", holder2PurchaseId, "balance", "60") // 50 + 30 - 20
      
      let holder3PurchaseId = holder3.toHexString().concat("-").concat(assetAddress.toHexString())
      assert.fieldEquals("Purchase", holder3PurchaseId, "balance", "30") // 20 + 10
    })

    test("Should create new purchase for recipient if doesn't exist", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let holder1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let holder2 = Address.fromString("0x0000000000000000000000000000000000000022")
      
      // Create a mock asset
      let asset = new Asset(Bytes.fromHexString(assetAddress.toHexString()))
      asset.creator = Bytes.fromHexString(holder1.toHexString())
      asset.contentCid = "QmTest"
      asset.title = "Test Asset"
      asset.thumbnailCid = "QmThumb"
      asset.priceInWei = BigInt.fromI32(1000)
      asset.createdAt = BigInt.fromI32(1000000)
      asset.save()

      // Setup: Create initial purchase for holder1
      let holder1PurchaseId = holder1.toHexString().concat("-").concat(assetAddress.toHexString())
      let holder1Purchase = new Purchase(holder1PurchaseId)
      holder1Purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      holder1Purchase.holder = Bytes.fromHexString(holder1.toHexString())
      holder1Purchase.balance = BigInt.fromI32(100)
      holder1Purchase.amountPaid = BigInt.fromI32(100000)
      holder1Purchase.purchasedAt = BigInt.fromI32(1000000)
      holder1Purchase.save()

      // Transfer to holder2 who has no purchase yet
      let transferEvent = createTransferEvent(
        holder1,
        holder2,
        BigInt.fromI32(25)
      )
      transferEvent.address = assetAddress

      handleTransfer(transferEvent)

      // Verify new purchase was created for holder2
      let holder2PurchaseId = holder2.toHexString().concat("-").concat(assetAddress.toHexString())
      assert.entityCount("Purchase", 2)
      assert.fieldEquals("Purchase", holder2PurchaseId, "balance", "25")
      assert.fieldEquals("Purchase", holder2PurchaseId, "holder", holder2.toHexString())
      assert.fieldEquals("Purchase", holder2PurchaseId, "asset", assetAddress.toHexString())
    })

    test("Should handle transfer back and forth between holders", () => {
      let assetAddress = Address.fromString("0x0000000000000000000000000000000000000001")
      let holder1 = Address.fromString("0x0000000000000000000000000000000000000011")
      let holder2 = Address.fromString("0x0000000000000000000000000000000000000022")
      
      // Create a mock asset
      let asset = new Asset(Bytes.fromHexString(assetAddress.toHexString()))
      asset.creator = Bytes.fromHexString(holder1.toHexString())
      asset.contentCid = "QmTest"
      asset.title = "Test Asset"
      asset.thumbnailCid = "QmThumb"
      asset.priceInWei = BigInt.fromI32(1000)
      asset.createdAt = BigInt.fromI32(1000000)
      asset.save()

      // Setup: Create initial purchases
      let holder1PurchaseId = holder1.toHexString().concat("-").concat(assetAddress.toHexString())
      let holder1Purchase = new Purchase(holder1PurchaseId)
      holder1Purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      holder1Purchase.holder = Bytes.fromHexString(holder1.toHexString())
      holder1Purchase.balance = BigInt.fromI32(100)
      holder1Purchase.amountPaid = BigInt.fromI32(100000)
      holder1Purchase.purchasedAt = BigInt.fromI32(1000000)
      holder1Purchase.save()

      let holder2PurchaseId = holder2.toHexString().concat("-").concat(assetAddress.toHexString())
      let holder2Purchase = new Purchase(holder2PurchaseId)
      holder2Purchase.asset = Bytes.fromHexString(assetAddress.toHexString())
      holder2Purchase.holder = Bytes.fromHexString(holder2.toHexString())
      holder2Purchase.balance = BigInt.fromI32(50)
      holder2Purchase.amountPaid = BigInt.fromI32(50000)
      holder2Purchase.purchasedAt = BigInt.fromI32(1000000)
      holder2Purchase.save()

      // Transfer from holder1 to holder2
      let transfer1 = createTransferEvent(holder1, holder2, BigInt.fromI32(20))
      transfer1.address = assetAddress
      handleTransfer(transfer1)

      // Transfer from holder2 to holder1
      let transfer2 = createTransferEvent(holder2, holder1, BigInt.fromI32(15))
      transfer2.address = assetAddress
      handleTransfer(transfer2)

      // Check final balances
      assert.fieldEquals("Purchase", holder1PurchaseId, "balance", "95") // 100 - 20 + 15
      assert.fieldEquals("Purchase", holder2PurchaseId, "balance", "55") // 50 + 20 - 15
    })
  })
})
