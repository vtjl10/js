import type { Address } from "abitype";
import {
  isNativeTokenAddress,
  NATIVE_TOKEN_ADDRESS,
} from "../../../../constants/addresses.js";
import { getContract } from "../../../../contract/contract.js";
import { eth_getBlockByNumber } from "../../../../rpc/actions/eth_getBlockByNumber.js";
import { getRpcClient } from "../../../../rpc/rpc.js";
import type { BaseTransactionOptions } from "../../../../transaction/types.js";
import { toUnits } from "../../../../utils/units.js";
import { isERC721 } from "../../../erc721/read/isERC721.js";
import { isERC1155 } from "../../../erc1155/read/isERC1155.js";
import * as CreateListing from "../../__generated__/IDirectListings/write/createListing.js";

/**
 * @extension MARKETPLACE
 */
export type CreateListingParams = {
  /**
   * The contract address of the asset being listed
   */
  assetContractAddress: Address;
  /**
   * The ID of the token being listed
   */
  tokenId: bigint;
  /**
   * The quantity of tokens to list
   *
   * For ERC721s, this value can be omitted.
   * @default 1
   */
  quantity?: bigint;
  /**
   * The contract address of the currency to accept for the listing
   * @default NATIVE_TOKEN_ADDRESS
   */
  currencyContractAddress?: Address;
  /**
   * The start time of the listing
   * @default new Date()
   */
  startTimestamp?: Date;
  /**
   * The end time of the listing
   * @default new Date() + 10 years
   */
  endTimestamp?: Date;
  /**
   * Whether the listing is reserved to be bought from a specific set of buyers
   * @default false
   */
  isReservedListing?: boolean;
} & (
  | {
      /**
       * The price per token (in Ether)
       */
      pricePerToken: string;
    }
  | {
      /**
       * The price per token (in wei)
       */
      pricePerTokenWei: string;
    }
);

/**
 * Creates a direct listing.
 * @param options The options for creating the direct listing.
 * @returns The result of creating the direct listing.
 * @extension MARKETPLACE
 * @example
 * ```typescript
 * import { createListing } from "thirdweb/extensions/marketplace";
 * import { sendTransaction } from "thirdweb";
 *
 * const transaction = createListing({
 *   assetContractAddress: "0x...", // the NFT contract address that you want to sell
 *   tokenId={0n}, // the token id you want to sell
 *   pricePerToken="0.1" // sell for 0.1 <native token>
 * });
 *
 * await sendTransaction({ transaction, account });
 * ```
 */
export function createListing(
  options: BaseTransactionOptions<CreateListingParams>,
) {
  return CreateListing.createListing({
    asyncParams: async () => {
      const assetContract = getContract({
        ...options.contract,
        address: options.assetContractAddress,
      });

      const rpcClient = getRpcClient(options.contract);

      const [assetIsERC721, assetIsERC1155, lastestBlock] = await Promise.all([
        isERC721({ contract: assetContract }),
        isERC1155({ contract: assetContract }),
        eth_getBlockByNumber(rpcClient, { blockTag: "latest" }),
      ]);

      // validate valid asset
      if (!assetIsERC721 && !assetIsERC1155) {
        throw new Error("AssetContract must implement ERC 1155 or ERC 721.");
      }

      // validate the timestamps
      let startTimestamp = BigInt(
        Math.floor((options.startTimestamp ?? new Date()).getTime() / 1000),
      );
      const endTimestamp = BigInt(
        Math.floor(
          (
            options.endTimestamp ??
            new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
          ).getTime() / 1000,
        ),
      );

      if (startTimestamp <= lastestBlock.timestamp) {
        // set the start time to the next block if it is in the past
        startTimestamp = lastestBlock.timestamp + 1n;
      }
      if (startTimestamp >= endTimestamp) {
        throw new Error("Start time must be before end time.");
      }

      // valdiate quantity
      let quantity: bigint;
      if (assetIsERC721) {
        // force quantity to 1 for ERC721s
        quantity = 1n;
      } else {
        // otherwise use the provided quantity or default to 1
        quantity = options.quantity ?? 1n;
      }

      // validate price
      const currencyAddress =
        options.currencyContractAddress ?? NATIVE_TOKEN_ADDRESS;
      let pricePerToken: bigint;
      if ("pricePerToken" in options) {
        // for native token, we know decimals are 18
        if (isNativeTokenAddress(currencyAddress)) {
          pricePerToken = toUnits(options.pricePerToken, 18);
        } else {
          // otherwise get the decimals of the currency
          const currencyContract = getContract({
            ...options.contract,
            address: currencyAddress,
          });
          const { decimals } = await import("../../../erc20/read/decimals.js");
          const currencyDecimals = await decimals({
            contract: currencyContract,
          });
          pricePerToken = toUnits(options.pricePerToken, currencyDecimals);
        }
      } else {
        pricePerToken = BigInt(options.pricePerTokenWei);
      }

      return {
        overrides: {
          extraGas: 50_000n, // add extra gas to account for router call
        },
        params: {
          assetContract: options.assetContractAddress,
          currency: options.currencyContractAddress ?? NATIVE_TOKEN_ADDRESS,
          endTimestamp,
          pricePerToken,
          quantity,
          reserved: options.isReservedListing ?? false,
          startTimestamp,
          tokenId: options.tokenId,
        },
      } as const;
    },
    contract: options.contract,
  });
}

/**
 * Checks if the `createListing` method is supported by the given contract.
 * @param availableSelectors An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.
 * @returns A boolean indicating if the `createListing` method is supported.
 * @extension MARKETPLACE
 * @example
 * ```ts
 * import { isCreateAuctionSupported } from "thirdweb/extensions/marketplace";
 *
 * const supported = isCreateAuctionSupported(["0x..."]);
 * ```
 */
export function isCreateListingSupported(availableSelectors: string[]) {
  return CreateListing.isCreateListingSupported(availableSelectors);
}
