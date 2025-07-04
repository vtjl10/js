import type { GetBalanceResult } from "thirdweb/extensions/erc20";
import { Stat } from "../../overview/components/stat-card";

export function TokenDetailsCardUI(props: {
  tokenSupply: GetBalanceResult | undefined;
  isWalletConnected: boolean;
  ownedBalance: GetBalanceResult | undefined;
}) {
  const { tokenSupply, isWalletConnected, ownedBalance } = props;
  return (
    <div className="rounded-lg border bg-card">
      <h2 className="border-b p-6 py-5 font-semibold text-xl tracking-tight">
        Token Details
      </h2>
      <div className="flex flex-col gap-5 p-6 lg:flex-row">
        <Stat
          isPending={!tokenSupply}
          label="Circulating Supply"
          value={
            tokenSupply
              ? `${tokenSupply.displayValue} ${tokenSupply.symbol}`
              : ""
          }
        />

        {isWalletConnected && (
          <Stat
            isPending={!ownedBalance}
            label="Owned by you"
            value={
              ownedBalance
                ? `${ownedBalance?.displayValue} ${ownedBalance?.symbol}`
                : ""
            }
          />
        )}

        <Stat
          isPending={!tokenSupply}
          label="Decimals"
          value={tokenSupply ? tokenSupply?.decimals.toString() : ""}
        />
      </div>
    </div>
  );
}
