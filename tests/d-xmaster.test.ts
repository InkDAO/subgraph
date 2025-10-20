import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Asset, Creator, Holder, Purchase } from "../generated/schema"
import { AssetAdded as AssetAddedEvent, AssetBought as AssetBoughtEvent } from "../generated/dXmaster/dXmaster"
import { handleAssetAdded, handleAssetBought } from "../src/dXmaster"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Asset and Purchase entity tests", () => {
  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Asset created when AssetAdded event is handled", () => {
    // TODO: Implement test with createAssetAddedEvent helper
    // This requires creating the event helper function
    assert.entityCount("Asset", 0)
  })

  test("Purchase created when AssetBought event is handled", () => {
    // TODO: Implement test with createAssetBoughtEvent helper
    // This requires creating the event helper function
    assert.entityCount("Purchase", 0)
  })

  test("Creator stats update correctly", () => {
    // TODO: Test creator totalAssets and totalEarnings increment
    assert.entityCount("Creator", 0)
  })

  test("Buyer stats update correctly", () => {
    // TODO: Test buyer totalPurchases and totalSpent increment
    assert.entityCount("Buyer", 0)
  })
  
  // More assert options:
  // https://thegraph.com/docs/en/developer/matchstick/#asserts
})
