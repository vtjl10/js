"use client";

/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";
import { Img } from "../ui/Img";

const fallbackChainIcon =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTY4LjE1MTkgNzUuNzM3MkM2Mi4yOTQzIDc5Ljk5MyA1NS4yMzk3IDgyLjI4NTIgNDcuOTk5MyA4Mi4yODUyQzQwLjc1ODkgODIuMjg1MiAzMy43MDQzIDc5Ljk5MyAyNy44NDY2IDc1LjczNzJNNjMuMDI5MSAxNy4xODM3QzY5LjUzNjggMjAuMzU3NyA3NC44NzI2IDI1LjUxMDQgNzguMjcxOCAzMS45MDMzQzgxLjY3MDkgMzguMjk2MiA4Mi45NTkgNDUuNjAxMiA4MS45NTEzIDUyLjc3MTFNMTQuMDQ3NiA1Mi43NzA4QzEzLjAzOTkgNDUuNjAwOCAxNC4zMjggMzguMjk1OSAxNy43MjcxIDMxLjkwM0MyMS4xMjYzIDI1LjUxMDEgMjYuNDYyMSAyMC4zNTczIDMyLjk2OTggMTcuMTgzM000Ni4wNTk4IDI5LjM2NzVMMjkuMzY3MyA0Ni4wNkMyOC42ODg1IDQ2LjczODkgMjguMzQ5IDQ3LjA3ODMgMjguMjIxOCA0Ny40Njk3QzI4LjExIDQ3LjgxNCAyOC4xMSA0OC4xODQ5IDI4LjIyMTggNDguNTI5MkMyOC4zNDkgNDguOTIwNiAyOC42ODg1IDQ5LjI2MDEgMjkuMzY3MyA0OS45MzlMNDYuMDU5OCA2Ni42MzE0QzQ2LjczODcgNjcuMzEwMyA0Ny4wNzgxIDY3LjY0OTcgNDcuNDY5NSA2Ny43NzY5QzQ3LjgxMzggNjcuODg4OCA0OC4xODQ3IDY3Ljg4ODggNDguNTI5IDY3Ljc3NjlDNDguOTIwNCA2Ny42NDk3IDQ5LjI1OTkgNjcuMzEwMyA0OS45Mzg4IDY2LjYzMTRMNjYuNjMxMiA0OS45MzlDNjcuMzEwMSA0OS4yNjAxIDY3LjY0OTUgNDguOTIwNiA2Ny43NzY3IDQ4LjUyOTJDNjcuODg4NiA0OC4xODQ5IDY3Ljg4ODYgNDcuODE0IDY3Ljc3NjcgNDcuNDY5N0M2Ny42NDk1IDQ3LjA3ODMgNjcuMzEwMSA0Ni43Mzg5IDY2LjYzMTIgNDYuMDZMNDkuOTM4OCAyOS4zNjc1QzQ5LjI1OTkgMjguNjg4NyA0OC45MjA0IDI4LjM0OTIgNDguNTI5IDI4LjIyMkM0OC4xODQ3IDI4LjExMDIgNDcuODEzOCAyOC4xMTAyIDQ3LjQ2OTUgMjguMjIyQzQ3LjA3ODEgMjguMzQ5MiA0Ni43Mzg3IDI4LjY4ODcgNDYuMDU5OCAyOS4zNjc1WiIgc3Ryb2tlPSIjNDA0MDQwIiBzdHJva2Utd2lkdGg9IjYuODU3MTQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K";

import { resolveScheme } from "thirdweb/storage";
import { THIRDWEB_CLIENT } from "../../lib/client";

type ImageProps = React.ComponentProps<"img">;

type ChainIconProps = ImageProps & {
  ipfsSrc?: string;
};

export const ChainIcon = ({ ipfsSrc, ...restProps }: ChainIconProps) => {
  const src = ipfsSrc ? replaceIpfsUrl(ipfsSrc) : fallbackChainIcon;

  return (
    <Img
      {...restProps}
      // render different image element if src changes to avoid showing old image while loading new one
      alt=""
      className={cn("object-contain", restProps.className)}
      fallback={<img alt="" src={fallbackChainIcon} />}
      key={src}
      loading={restProps.loading || "lazy"}
      skeleton={<div className="animate-pulse rounded-full bg-border" />}
      src={src}
    />
  );
};

function replaceIpfsUrl(uri: string) {
  try {
    // eslint-disable-next-line no-restricted-syntax
    return resolveScheme({
      client: THIRDWEB_CLIENT,
      uri,
    });
  } catch (err) {
    console.error("error resolving ipfs url", uri, err);
    return uri;
  }
}
