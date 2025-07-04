"use client";

import type { EngineInstance } from "@3rdweb-sdk/react/hooks/useEngine";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { GenericLoadingPage } from "@/components/blocks/skeletons/GenericLoadingPage";
import { getEngineAccessPermission } from "../../../_utils/getEngineAccessPermission";
import { EngineErrorPage } from "./EngineErrorPage";

export function EnsureEnginePermission(props: {
  engineId: string;
  accountId: string;
  authToken: string;
  children: React.ReactNode;
  teamSlug: string;
  projectSlug: string;
  instance: EngineInstance;
}) {
  const { instance } = props;
  const rootPath = `/team/${props.teamSlug}/${props.projectSlug}/engine/dedicated`;

  const permissionQuery = useQuery({
    queryFn: () => {
      const url = instance.url;
      if (!url) {
        throw new Error();
      }

      return getEngineAccessPermission({
        authToken: props.authToken,
        instanceUrl: url,
      });
    },
    queryKey: [
      "engine-permission",
      {
        authToken: props.authToken,
        instanceUrl: instance.url,
      },
    ],
    retry: false,
  });

  if (permissionQuery.isPending) {
    return <GenericLoadingPage />;
  }

  if (!permissionQuery.data) {
    return (
      <EngineErrorPage rootPath={rootPath}>
        Failed to verify access to engine instance
      </EngineErrorPage>
    );
  }

  const permission = permissionQuery.data;

  if (!permission.ok) {
    if (permission.status === 404) {
      return (
        <EngineErrorPage rootPath={rootPath}>
          <p> Engine instance not found </p>
        </EngineErrorPage>
      );
    }

    if (permission.fetchFailed) {
      return (
        <EngineErrorPage rootPath={rootPath}>
          <p> Engine instance could not be reached </p>
        </EngineErrorPage>
      );
    }

    if (permission.status === 401 || permission.status === 500) {
      return (
        <EngineErrorPage rootPath={rootPath}>
          <div>
            <p>You are not an admin for this Engine instance. </p>
            <p> Contact the owner to add your wallet as an admin</p>
          </div>
        </EngineErrorPage>
      );
    }
  }

  return <div>{props.children}</div>;
}
