import type { AbiParameterToPrimitiveType } from "abitype";
import { decodeAbiParameters } from "viem";
import { readContract } from "../../../../../transaction/read-contract.js";
import type { BaseTransactionOptions } from "../../../../../transaction/types.js";
import { encodeAbiParameters } from "../../../../../utils/abi/encodeAbiParameters.js";
import { detectMethod } from "../../../../../utils/bytecode/detectExtension.js";
import type { Hex } from "../../../../../utils/encoding/hex.js";

/**
 * Represents the parameters for the "tokensOfOwner" function.
 */
export type TokensOfOwnerParams = {
  owner: AbiParameterToPrimitiveType<{ type: "address"; name: "owner" }>;
};

export const FN_SELECTOR = "0x8462151c" as const;
const FN_INPUTS = [
  {
    name: "owner",
    type: "address",
  },
] as const;
const FN_OUTPUTS = [
  {
    type: "uint256[]",
  },
] as const;

/**
 * Checks if the `tokensOfOwner` method is supported by the given contract.
 * @param availableSelectors An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.
 * @returns A boolean indicating if the `tokensOfOwner` method is supported.
 * @extension ERC721
 * @example
 * ```ts
 * import { isTokensOfOwnerSupported } from "thirdweb/extensions/erc721";
 * const supported = isTokensOfOwnerSupported(["0x..."]);
 * ```
 */
export function isTokensOfOwnerSupported(availableSelectors: string[]) {
  return detectMethod({
    availableSelectors,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
  });
}

/**
 * Encodes the parameters for the "tokensOfOwner" function.
 * @param options - The options for the tokensOfOwner function.
 * @returns The encoded ABI parameters.
 * @extension ERC721
 * @example
 * ```ts
 * import { encodeTokensOfOwnerParams } from "thirdweb/extensions/erc721";
 * const result = encodeTokensOfOwnerParams({
 *  owner: ...,
 * });
 * ```
 */
export function encodeTokensOfOwnerParams(options: TokensOfOwnerParams) {
  return encodeAbiParameters(FN_INPUTS, [options.owner]);
}

/**
 * Encodes the "tokensOfOwner" function into a Hex string with its parameters.
 * @param options - The options for the tokensOfOwner function.
 * @returns The encoded hexadecimal string.
 * @extension ERC721
 * @example
 * ```ts
 * import { encodeTokensOfOwner } from "thirdweb/extensions/erc721";
 * const result = encodeTokensOfOwner({
 *  owner: ...,
 * });
 * ```
 */
export function encodeTokensOfOwner(options: TokensOfOwnerParams) {
  // we do a "manual" concat here to avoid the overhead of the "concatHex" function
  // we can do this because we know the specific formats of the values
  return (FN_SELECTOR +
    encodeTokensOfOwnerParams(options).slice(
      2,
    )) as `${typeof FN_SELECTOR}${string}`;
}

/**
 * Decodes the result of the tokensOfOwner function call.
 * @param result - The hexadecimal result to decode.
 * @returns The decoded result as per the FN_OUTPUTS definition.
 * @extension ERC721
 * @example
 * ```ts
 * import { decodeTokensOfOwnerResult } from "thirdweb/extensions/erc721";
 * const result = decodeTokensOfOwnerResultResult("...");
 * ```
 */
export function decodeTokensOfOwnerResult(result: Hex) {
  return decodeAbiParameters(FN_OUTPUTS, result)[0];
}

/**
 * Calls the "tokensOfOwner" function on the contract.
 * @param options - The options for the tokensOfOwner function.
 * @returns The parsed result of the function call.
 * @extension ERC721
 * @example
 * ```ts
 * import { tokensOfOwner } from "thirdweb/extensions/erc721";
 *
 * const result = await tokensOfOwner({
 *  contract,
 *  owner: ...,
 * });
 *
 * ```
 */
export async function tokensOfOwner(
  options: BaseTransactionOptions<TokensOfOwnerParams>,
) {
  return readContract({
    contract: options.contract,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
    params: [options.owner],
  });
}
