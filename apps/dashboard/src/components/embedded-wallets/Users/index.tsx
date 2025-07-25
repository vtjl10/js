"use client";

import {
  useAllEmbeddedWallets,
  useEmbeddedWallets,
} from "@3rdweb-sdk/react/hooks/useEmbeddedWallets";
import { createColumnHelper } from "@tanstack/react-table";
import { TWTable } from "components/shared/TWTable";
import { format } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useMemo, useState } from "react";
import type { ThirdwebClient } from "thirdweb";
import type { WalletUser } from "thirdweb/wallets";
import { WalletAddress } from "@/components/blocks/wallet-address";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchInput } from "./SearchInput";

const getUserIdentifier = (accounts: WalletUser["linkedAccounts"]) => {
  const mainDetail = accounts[0]?.details;
  return (
    mainDetail?.email ??
    mainDetail?.phone ??
    mainDetail?.address ??
    mainDetail?.id
  );
};

const columnHelper = createColumnHelper<WalletUser>();

export function InAppWalletUsersPageContent(props: {
  authToken: string;
  projectClientId: string;
  client: ThirdwebClient;
}) {
  const columns = useMemo(() => {
    return [
      columnHelper.accessor("linkedAccounts", {
        cell: (cell) => {
          const identifier = getUserIdentifier(cell.getValue());
          return <span className="text-sm">{identifier}</span>;
        },
        enableColumnFilter: true,
        header: "User Identifier",
        id: "user_identifier",
      }),
      columnHelper.accessor("wallets", {
        cell: (cell) => {
          const address = cell.getValue()[0]?.address;
          return address ? (
            <WalletAddress address={address} client={props.client} />
          ) : null;
        },
        header: "Address",
        id: "address",
      }),
      columnHelper.accessor("wallets", {
        cell: (cell) => {
          const value = cell.getValue()[0]?.createdAt;

          if (!value) {
            return;
          }
          return (
            <span className="text-sm">
              {format(new Date(value), "MMM dd, yyyy")}
            </span>
          );
        },
        header: "Created",
        id: "created_at",
      }),
      columnHelper.accessor("linkedAccounts", {
        cell: (cell) => {
          const value = cell.getValue();
          const loginMethodsDisplay = value.reduce((acc, curr) => {
            if (acc.length === 2) {
              acc.push("...");
            }
            if (acc.length < 2) {
              acc.push(curr.type);
            }
            return acc;
          }, [] as string[]);
          const loginMethods = value.map((v) => v.type).join(", ");
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-sm">
                  {loginMethodsDisplay.join(", ")}
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-sm">{loginMethods}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        header: "Login Methods",
        id: "login_methods",
      }),
    ];
  }, [props.client]);

  const [activePage, setActivePage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const walletsQuery = useEmbeddedWallets({
    authToken: props.authToken,
    clientId: props.projectClientId,
    page: activePage,
  });
  const wallets = walletsQuery?.data?.users || [];
  const filteredWallets = searchValue
    ? wallets.filter((wallet) => {
        const term = searchValue.toLowerCase();
        if (wallet.id.toLowerCase().includes(term)) {
          return true;
        }
        if (
          wallet.wallets?.some((w) => w.address?.toLowerCase().includes(term))
        ) {
          return true;
        }
        if (
          wallet.linkedAccounts?.some((acc) => {
            return Object.values(acc.details).some(
              (detail) =>
                typeof detail === "string" &&
                detail.toLowerCase().includes(term),
            );
          })
        ) {
          return true;
        }
        return false;
      })
    : wallets;
  const { mutateAsync: getAllEmbeddedWallets, isPending } =
    useAllEmbeddedWallets({
      authToken: props.authToken,
    });

  const downloadCSV = useCallback(async () => {
    if (wallets.length === 0 || !getAllEmbeddedWallets) {
      return;
    }
    const usersWallets = await getAllEmbeddedWallets({
      clientId: props.projectClientId,
    });
    const csv = Papa.unparse(
      usersWallets.map((row) => {
        return {
          address: row.wallets[0]?.address || "Uninitialized",
          created: row.wallets[0]?.createdAt
            ? format(new Date(row.wallets[0].createdAt), "MMM dd, yyyy")
            : "Wallet not created yet",
          login_methods: row.linkedAccounts.map((acc) => acc.type).join(", "),
          user_identifier: getUserIdentifier(row.linkedAccounts),
        };
      }),
    );
    const csvUrl = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const tempLink = document.createElement("a");
    tempLink.href = csvUrl;
    tempLink.setAttribute("download", "download.csv");
    tempLink.click();
  }, [wallets, props.projectClientId, getAllEmbeddedWallets]);

  return (
    <div>
      <div className="flex flex-col gap-4">
        {/* Top section */}
        <div className="flex items-center justify-end gap-3">
          <div className="w-full max-w-xs">
            <SearchInput
              onValueChange={setSearchValue}
              placeholder="Search"
              value={searchValue}
            />
          </div>
          <Button
            className="gap-2"
            disabled={wallets.length === 0 || isPending}
            onClick={downloadCSV}
            size="sm"
            variant="outline"
          >
            {isPending && <Spinner className="size-4" />}
            Download as .csv
          </Button>
        </div>

        <div>
          <TWTable
            columns={columns}
            data={filteredWallets}
            isFetched={walletsQuery.isFetched}
            isPending={walletsQuery.isPending}
            tableContainerClassName="rounded-b-none"
            title="in-app wallets"
          />

          <div className="flex justify-center gap-3 rounded-b-lg border border-t-0 bg-card p-6">
            <Button
              className="gap-2 bg-background"
              disabled={activePage === 1 || walletsQuery.isPending}
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              size="sm"
              variant="outline"
            >
              <ArrowLeftIcon className="size-4" />
              Previous
            </Button>
            <Button
              className="gap-2 bg-background"
              disabled={wallets.length === 0 || walletsQuery.isPending}
              onClick={() => setActivePage((p) => p + 1)}
              size="sm"
              variant="outline"
            >
              Next
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
