import { bench } from "vitest";
import { VITALIK_WALLET } from "../../../test/src/addresses.js";
import {
  USDT_CONTRACT,
  USDT_CONTRACT_WITH_ABI,
} from "../../../test/src/test-contracts.js";
import { prepareMethod } from "../../utils/abi/prepare-method.js";
import { prepareContractCall } from "../prepare-contract-call.js";
import { encode } from "./encode.js";

bench("encode tx (human readable)", async () => {
  const tx = prepareContractCall({
    contract: { ...USDT_CONTRACT },
    method: "function transfer(address,uint256)",
    params: [VITALIK_WALLET, 100n],
  });
  await encode(tx);
});

bench("encode tx (json abi)", async () => {
  const tx = prepareContractCall({
    contract: { ...USDT_CONTRACT },
    method: {
      inputs: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    params: [VITALIK_WALLET, 100n],
  });
  await encode(tx);
});

bench("encode tx (contract abi)", async () => {
  const tx = prepareContractCall({
    contract: { ...USDT_CONTRACT_WITH_ABI },
    method: "transfer",
    params: [VITALIK_WALLET, 100n],
  });
  await encode(tx);
});

bench("encode tx (prepared method)", async () => {
  const tx = prepareContractCall({
    contract: { ...USDT_CONTRACT },
    method: prepareMethod("function transfer(address,uint256)"),
    params: [VITALIK_WALLET, 100n],
  });
  await encode(tx);
});
