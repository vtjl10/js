import type { AbiParameterToPrimitiveType } from "abitype";
import { decodeAbiParameters } from "viem";
import { readContract } from "../../../../../transaction/read-contract.js";
import type { BaseTransactionOptions } from "../../../../../transaction/types.js";
import { encodeAbiParameters } from "../../../../../utils/abi/encodeAbiParameters.js";
import { detectMethod } from "../../../../../utils/bytecode/detectExtension.js";
import type { Hex } from "../../../../../utils/encoding/hex.js";

/**
 * Represents the parameters for the "getStakeInfoForToken" function.
 */
export type GetStakeInfoForTokenParams = {
  tokenId: AbiParameterToPrimitiveType<{ type: "uint256"; name: "tokenId" }>;
  staker: AbiParameterToPrimitiveType<{ type: "address"; name: "staker" }>;
};

export const FN_SELECTOR = "0x168fb5c5" as const;
const FN_INPUTS = [
  {
    name: "tokenId",
    type: "uint256",
  },
  {
    name: "staker",
    type: "address",
  },
] as const;
const FN_OUTPUTS = [
  {
    name: "_tokensStaked",
    type: "uint256",
  },
  {
    name: "_rewards",
    type: "uint256",
  },
] as const;

/**
 * Checks if the `getStakeInfoForToken` method is supported by the given contract.
 * @param availableSelectors An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.
 * @returns A boolean indicating if the `getStakeInfoForToken` method is supported.
 * @extension ERC1155
 * @example
 * ```ts
 * import { isGetStakeInfoForTokenSupported } from "thirdweb/extensions/erc1155";
 * const supported = isGetStakeInfoForTokenSupported(["0x..."]);
 * ```
 */
export function isGetStakeInfoForTokenSupported(availableSelectors: string[]) {
  return detectMethod({
    availableSelectors,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
  });
}

/**
 * Encodes the parameters for the "getStakeInfoForToken" function.
 * @param options - The options for the getStakeInfoForToken function.
 * @returns The encoded ABI parameters.
 * @extension ERC1155
 * @example
 * ```ts
 * import { encodeGetStakeInfoForTokenParams } from "thirdweb/extensions/erc1155";
 * const result = encodeGetStakeInfoForTokenParams({
 *  tokenId: ...,
 *  staker: ...,
 * });
 * ```
 */
export function encodeGetStakeInfoForTokenParams(
  options: GetStakeInfoForTokenParams,
) {
  return encodeAbiParameters(FN_INPUTS, [options.tokenId, options.staker]);
}

/**
 * Encodes the "getStakeInfoForToken" function into a Hex string with its parameters.
 * @param options - The options for the getStakeInfoForToken function.
 * @returns The encoded hexadecimal string.
 * @extension ERC1155
 * @example
 * ```ts
 * import { encodeGetStakeInfoForToken } from "thirdweb/extensions/erc1155";
 * const result = encodeGetStakeInfoForToken({
 *  tokenId: ...,
 *  staker: ...,
 * });
 * ```
 */
export function encodeGetStakeInfoForToken(
  options: GetStakeInfoForTokenParams,
) {
  // we do a "manual" concat here to avoid the overhead of the "concatHex" function
  // we can do this because we know the specific formats of the values
  return (FN_SELECTOR +
    encodeGetStakeInfoForTokenParams(options).slice(
      2,
    )) as `${typeof FN_SELECTOR}${string}`;
}

/**
 * Decodes the result of the getStakeInfoForToken function call.
 * @param result - The hexadecimal result to decode.
 * @returns The decoded result as per the FN_OUTPUTS definition.
 * @extension ERC1155
 * @example
 * ```ts
 * import { decodeGetStakeInfoForTokenResult } from "thirdweb/extensions/erc1155";
 * const result = decodeGetStakeInfoForTokenResultResult("...");
 * ```
 */
export function decodeGetStakeInfoForTokenResult(result: Hex) {
  return decodeAbiParameters(FN_OUTPUTS, result);
}

/**
 * Calls the "getStakeInfoForToken" function on the contract.
 * @param options - The options for the getStakeInfoForToken function.
 * @returns The parsed result of the function call.
 * @extension ERC1155
 * @example
 * ```ts
 * import { getStakeInfoForToken } from "thirdweb/extensions/erc1155";
 *
 * const result = await getStakeInfoForToken({
 *  contract,
 *  tokenId: ...,
 *  staker: ...,
 * });
 *
 * ```
 */
export async function getStakeInfoForToken(
  options: BaseTransactionOptions<GetStakeInfoForTokenParams>,
) {
  return readContract({
    contract: options.contract,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
    params: [options.tokenId, options.staker],
  });
}
