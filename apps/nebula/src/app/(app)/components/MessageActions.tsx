import { useMutation } from "@tanstack/react-query";
import {
  CheckIcon,
  CopyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { cn } from "@/lib/utils";
import { submitFeedback } from "../api/feedback";

export function MessageActions(props: {
  authToken: string;
  requestId: string;
  sessionId: string;
  messageText: string | undefined;
  className?: string;
  buttonClassName?: string;
}) {
  const [isCopied, setIsCopied] = useState(false);
  function sendRating(rating: "good" | "bad") {
    return submitFeedback({
      authToken: props.authToken,
      rating,
      requestId: props.requestId,
      sessionId: props.sessionId,
    });
  }
  const sendPositiveRating = useMutation({
    mutationFn: () => sendRating("good"),
    onError() {
      toast.error("Failed to send feedback", {
        position: "top-right",
      });
    },
    onSuccess() {
      toast.info("Thanks for the feedback!", {
        position: "top-right",
      });
    },
  });

  const sendBadRating = useMutation({
    mutationFn: () => sendRating("bad"),
    onError() {
      toast.error("Failed to send feedback", {
        position: "top-right",
      });
    },
    onSuccess() {
      toast.info("Thanks for the feedback!", {
        position: "top-right",
      });
    },
  });

  const { messageText } = props;

  return (
    <div
      className={cn("flex items-center gap-2 text-foreground", props.className)}
    >
      {messageText && (
        <Button
          className={cn("h-8 gap-2 rounded-lg text-sm", props.buttonClassName)}
          onClick={() => {
            navigator.clipboard.writeText(messageText);
            setIsCopied(true);
            setTimeout(() => {
              setIsCopied(false);
            }, 1000);
          }}
          size="sm"
          variant="outline"
        >
          {isCopied ? (
            <CheckIcon className="size-3.5 text-green-500" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
          Copy
        </Button>
      )}

      <Button
        className={cn(
          "size-8 rounded-lg bg-background p-0",
          props.buttonClassName,
        )}
        onClick={() => {
          sendPositiveRating.mutate();
        }}
        size="sm"
        variant="outline"
      >
        {sendPositiveRating.isPending ? (
          <Spinner className="size-4" />
        ) : (
          <ThumbsUpIcon className="size-4" />
        )}
      </Button>

      <Button
        className={cn(
          "size-8 rounded-lg bg-background p-0",
          props.buttonClassName,
        )}
        onClick={() => {
          sendBadRating.mutate();
        }}
        size="sm"
        variant="outline"
      >
        {sendBadRating.isPending ? (
          <Spinner className="size-4" />
        ) : (
          <ThumbsDownIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}
