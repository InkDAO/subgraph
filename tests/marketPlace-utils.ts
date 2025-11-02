import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import { PostCreated, PostSubscribed } from "../generated/marketPlace/marketPlace"

export function createPostCreatedEvent(
  tokenId: BigInt,
  postTitle: string,
  postCid: string,
  thumbnailCid: string,
  author: Address,
  costInNativeInWei: BigInt
): PostCreated {
  let postCreatedEvent = changetype<PostCreated>(newMockEvent())

  postCreatedEvent.parameters = new Array()

  postCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  postCreatedEvent.parameters.push(
    new ethereum.EventParam("postTitle", ethereum.Value.fromString(postTitle))
  )
  postCreatedEvent.parameters.push(
    new ethereum.EventParam("postCid", ethereum.Value.fromString(postCid))
  )
  postCreatedEvent.parameters.push(
    new ethereum.EventParam("thumbnailCid", ethereum.Value.fromString(thumbnailCid))
  )
  postCreatedEvent.parameters.push(
    new ethereum.EventParam("author", ethereum.Value.fromAddress(author))
  )
  postCreatedEvent.parameters.push(
    new ethereum.EventParam("costInNativeInWei", ethereum.Value.fromUnsignedBigInt(costInNativeInWei))
  )

  return postCreatedEvent
}

export function createPostSubscribedEvent(
  tokenId: BigInt,
  subscriber: Address,
  totalCost: BigInt
): PostSubscribed {
  let postSubscribedEvent = changetype<PostSubscribed>(newMockEvent())

  postSubscribedEvent.parameters = new Array()

  postSubscribedEvent.parameters.push(
    new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))
  )
  postSubscribedEvent.parameters.push(
    new ethereum.EventParam("subscriber", ethereum.Value.fromAddress(subscriber))
  )
  postSubscribedEvent.parameters.push(
    new ethereum.EventParam("totalCost", ethereum.Value.fromUnsignedBigInt(totalCost))
  )

  return postSubscribedEvent
}