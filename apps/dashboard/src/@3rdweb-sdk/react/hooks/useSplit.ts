import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { sendAndConfirmTransaction, type ThirdwebContract } from "thirdweb";
import { distribute, distributeByToken } from "thirdweb/extensions/split";
import { useActiveAccount } from "thirdweb/react";
import invariant from "tiny-invariant";
import { getTokenBalancesFromMoralis } from "@/actions/getBalancesFromMoralis";

function getTokenBalancesQuery(contract: ThirdwebContract) {
  return queryOptions({
    queryFn: async () => {
      const res = await getTokenBalancesFromMoralis({
        chainId: contract.chain.id,
        contractAddress: contract.address,
      });

      if (!res.data) {
        throw new Error(res.error);
      }
      return res.data;
    },
    queryKey: ["split-balances", contract.chain.id, contract.address],
    retry: false,
  });
}

export function useSplitBalances(contract: ThirdwebContract) {
  return useQuery(getTokenBalancesQuery(contract));
}

export function useSplitDistributeFunds(contract: ThirdwebContract) {
  const account = useActiveAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      invariant(account, "No active account");
      const balances =
        // get the cached data if it exists, otherwise fetch it
        queryClient.getQueryData(getTokenBalancesQuery(contract).queryKey) ||
        (await queryClient.fetchQuery(getTokenBalancesQuery(contract)));

      const distributions = balances
        .filter((token) => token.display_balance !== "0.0")
        .map(async (currency) => {
          const transaction =
            currency.name === "Native Token"
              ? distribute({ contract })
              : distributeByToken({
                  contract,
                  tokenAddress: currency.token_address,
                });
          const promise = sendAndConfirmTransaction({
            account,
            transaction,
          });
          toast.promise(promise, {
            error: `Error distributing ${currency.name}`,
            loading: `Distributing ${currency.name}`,
            success: `Successfully distributed ${currency.name}`,
          });
        });

      return await Promise.all(distributions);
    },
    onSettled: () => {
      queryClient.invalidateQueries(getTokenBalancesQuery(contract));
    },
  });
}
