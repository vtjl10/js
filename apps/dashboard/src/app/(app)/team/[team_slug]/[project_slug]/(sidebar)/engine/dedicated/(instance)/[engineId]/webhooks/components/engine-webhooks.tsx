"use client";

import { useEngineWebhooks } from "@3rdweb-sdk/react/hooks/useEngine";
import { Heading, Link, Text } from "tw-components";
import { AddWebhookButton } from "./add-webhook-button";
import { WebhooksTable } from "./webhooks-table";

interface EngineWebhooksProps {
  instanceUrl: string;
  authToken: string;
}

export const EngineWebhooks: React.FC<EngineWebhooksProps> = ({
  instanceUrl,
  authToken,
}) => {
  const webhooks = useEngineWebhooks({
    authToken,
    instanceUrl,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Heading size="title.md">Webhooks</Heading>
        <Text>
          Notify your app backend when transaction and backend wallet events
          occur.{" "}
          <Link
            color="primary.500"
            href="https://portal.thirdweb.com/infrastructure/engine/features/webhooks"
            isExternal
          >
            Learn more about webhooks
          </Link>
          .
        </Text>
      </div>
      <WebhooksTable
        authToken={authToken}
        instanceUrl={instanceUrl}
        isFetched={webhooks.isFetched}
        isPending={webhooks.isPending}
        webhooks={webhooks.data || []}
      />
      <AddWebhookButton authToken={authToken} instanceUrl={instanceUrl} />
    </div>
  );
};
