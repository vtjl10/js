"use client";

import { useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useAllChainsData } from "../../app/hooks/chains";
import { ChainIcon } from "./ChainIcon";
import { MultiSelect } from "./multi-select";

function cleanChainName(chainName: string) {
  return chainName.replace("Mainnet", "");
}

type Option = { label: string; value: string };

export function MultiNetworkSelector(props: {
  selectedChainIds: number[];
  onChange: (chainIds: number[]) => void;
  disableChainId?: boolean;
  className?: string;
  priorityChains?: number[];
  popoverContentClassName?: string;
  chainIds?: number[];
  selectedBadgeClassName?: string;
}) {
  const { allChains, idToChain } = useAllChainsData().data;

  const chainsToShow = useMemo(() => {
    if (!props.chainIds) {
      return allChains;
    }
    const chainIdSet = new Set(props.chainIds);
    return allChains.filter((chain) => chainIdSet.has(chain.chainId));
  }, [allChains, props.chainIds]);

  const options = useMemo(() => {
    let sortedChains = chainsToShow;

    if (props.priorityChains) {
      const priorityChainsSet = new Set();
      for (const chainId of props.priorityChains || []) {
        priorityChainsSet.add(chainId);
      }

      const priorityChains = (props.priorityChains || [])
        .map((chainId) => {
          return idToChain.get(chainId);
        })
        .filter((v) => !!v);

      const otherChains = chainsToShow.filter(
        (chain) => !priorityChainsSet.has(chain.chainId),
      );

      sortedChains = [...priorityChains, ...otherChains];
    }

    return sortedChains.map((chain) => {
      return {
        label: cleanChainName(chain.name),
        value: String(chain.chainId),
      };
    });
  }, [chainsToShow, props.priorityChains, idToChain]);

  const searchFn = useCallback(
    (option: Option, searchValue: string) => {
      const chain = idToChain.get(Number(option.value));
      if (!chain) {
        return false;
      }

      if (Number.isInteger(Number.parseInt(searchValue))) {
        return String(chain.chainId).startsWith(searchValue);
      }
      return chain.name.toLowerCase().includes(searchValue.toLowerCase());
    },
    [idToChain],
  );

  const renderOption = useCallback(
    (option: Option) => {
      const chain = idToChain.get(Number(option.value));
      if (!chain) {
        return option.label;
      }

      return (
        <div className="flex justify-between gap-4">
          <span className="flex grow gap-2 truncate text-left">
            <ChainIcon
              className="size-5"
              ipfsSrc={chain.icon?.url}
              loading="lazy"
            />
            {cleanChainName(chain.name)}
          </span>

          {!props.disableChainId && (
            <Badge className="gap-2" variant="outline">
              <span className="text-muted-foreground">Chain ID</span>
              {chain.chainId}
            </Badge>
          )}
        </div>
      );
    },
    [idToChain, props.disableChainId],
  );

  return (
    <MultiSelect
      className={props.className}
      disabled={allChains.length === 0}
      onSelectedValuesChange={(chainIds) => {
        props.onChange(chainIds.map(Number));
      }}
      options={options}
      overrideSearchFn={searchFn}
      placeholder={
        allChains.length === 0 ? "Loading Chains..." : "Select Chains"
      }
      popoverContentClassName={props.popoverContentClassName}
      renderOption={renderOption}
      searchPlaceholder="Search by Name or Chain Id"
      selectedBadgeClassName={props.selectedBadgeClassName}
      selectedValues={props.selectedChainIds.map(String)}
    />
  );
}
