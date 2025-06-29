"use client";

import {
  type AddContractSubscriptionInput,
  useEngineAddContractSubscription,
} from "@3rdweb-sdk/react/hooks/useEngine";
import { useResolveContractAbi } from "@3rdweb-sdk/react/hooks/useResolveContractAbi";
import {
  Collapse,
  Flex,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Spinner,
  type UseDisclosureReturn,
  useDisclosure,
} from "@chakra-ui/react";
import { useTxNotifications } from "hooks/useTxNotifications";
import { useV5DashboardChain } from "lib/v5-adapter";
import { CirclePlusIcon } from "lucide-react";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { getContract, isAddress, type ThirdwebClient } from "thirdweb";
import {
  Button,
  Card,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Text,
} from "tw-components";
import { SingleNetworkSelector } from "@/components/blocks/NetworkSelectors";
import { Checkbox, CheckboxWithLabel } from "@/components/ui/checkbox";

interface AddContractSubscriptionButtonProps {
  instanceUrl: string;
  authToken: string;
  client: ThirdwebClient;
}

export const AddContractSubscriptionButton: React.FC<
  AddContractSubscriptionButtonProps
> = ({ instanceUrl, authToken, client }) => {
  const disclosure = useDisclosure();

  return (
    <>
      <Button
        colorScheme="primary"
        leftIcon={<CirclePlusIcon className="size-6" />}
        onClick={disclosure.onOpen}
        size="sm"
        variant="ghost"
        w="fit-content"
      >
        Add Contract Subscription
      </Button>

      {disclosure.isOpen && (
        <AddModal
          authToken={authToken}
          client={client}
          disclosure={disclosure}
          instanceUrl={instanceUrl}
        />
      )}
    </>
  );
};

interface AddContractSubscriptionForm {
  chainId: number;
  contractAddress: string;
  webhookUrl: string;
  processEventLogs: boolean;
  filterEvents: string[];
  processTransactionReceipts: boolean;
  filterFunctions: string[];
}

const AddModal = ({
  instanceUrl,
  disclosure,
  authToken,
  client,
}: {
  instanceUrl: string;
  disclosure: UseDisclosureReturn;
  authToken: string;
  client: ThirdwebClient;
}) => {
  const { mutate: addContractSubscription } = useEngineAddContractSubscription({
    authToken,
    instanceUrl,
  });

  const { onSuccess, onError } = useTxNotifications(
    "Created Contract Subscription.",
    "Failed to create Contract Subscription.",
  );
  const [modalState, setModalState] = useState<"inputContract" | "inputData">(
    "inputContract",
  );

  const form = useForm<AddContractSubscriptionForm>({
    defaultValues: {
      chainId: 84532,
      filterEvents: [],
      filterFunctions: [],
      processEventLogs: true,
      processTransactionReceipts: false,
    },
    mode: "onChange",
  });

  const onSubmit = (data: AddContractSubscriptionForm) => {
    const input: AddContractSubscriptionInput = {
      chain: data.chainId.toString(),
      contractAddress: data.contractAddress,
      filterEvents: data.filterEvents,
      filterFunctions: data.filterFunctions,
      processEventLogs: data.processEventLogs,
      processTransactionReceipts: data.processTransactionReceipts,
      webhookUrl: data.webhookUrl.trim(),
    };

    addContractSubscription(input, {
      onError: (error) => {
        onError(error);
        console.error(error);
      },
      onSuccess: () => {
        onSuccess();
        disclosure.onClose();
      },
    });
  };

  return (
    <Modal
      isCentered
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
      size="lg"
    >
      <ModalOverlay />
      <ModalContent
        as="form"
        className="!bg-background rounded-lg border border-border"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <ModalHeader>Add Contract Subscription</ModalHeader>
        <ModalCloseButton />

        {modalState === "inputContract" ? (
          <ModalBodyInputContract
            client={client}
            form={form}
            setModalState={setModalState}
          />
        ) : modalState === "inputData" ? (
          <ModalBodyInputData
            client={client}
            form={form}
            setModalState={setModalState}
          />
        ) : null}
      </ModalContent>
    </Modal>
  );
};

const ModalBodyInputContract = ({
  form,
  setModalState,
  client,
}: {
  form: UseFormReturn<AddContractSubscriptionForm>;
  setModalState: Dispatch<SetStateAction<"inputContract" | "inputData">>;
  client: ThirdwebClient;
}) => {
  return (
    <>
      <ModalBody>
        <div className="flex flex-col gap-4">
          <Text>
            Add a contract subscription to process real-time onchain data.
          </Text>

          <FormControl isRequired>
            <FormLabel>Chain</FormLabel>
            <SingleNetworkSelector
              chainId={form.watch("chainId")}
              client={client}
              onChange={(val) => form.setValue("chainId", val)}
            />
          </FormControl>

          <FormControl
            isInvalid={
              !!form.getFieldState("contractAddress", form.formState).error
            }
            isRequired
          >
            <FormLabel>Contract Address</FormLabel>
            <Input
              placeholder="0x..."
              type="text"
              {...form.register("contractAddress", {
                required: true,
                validate: (v) => {
                  const isValid = isAddress(v);
                  return !isValid ? "Invalid address" : true;
                },
              })}
            />
            <FormErrorMessage>
              {
                form.getFieldState("contractAddress", form.formState).error
                  ?.message
              }
            </FormErrorMessage>
          </FormControl>

          <FormControl
            isInvalid={!!form.getFieldState("webhookUrl", form.formState).error}
            isRequired
          >
            <FormLabel>Webhook URL</FormLabel>
            <Input
              placeholder="https://"
              type="url"
              {...form.register("webhookUrl", {
                required: true,
                validate: (v) => {
                  try {
                    new URL(v);
                    return true;
                  } catch {
                    return "Invalid URL";
                  }
                },
              })}
            />
            <FormHelperText>
              Engine sends an HTTP request to your backend when new onchain data
              for this contract is detected.
            </FormHelperText>
            <FormErrorMessage>
              {form.getFieldState("webhookUrl", form.formState).error?.message}
            </FormErrorMessage>
          </FormControl>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          colorScheme="primary"
          isDisabled={!form.formState.isValid}
          onClick={() => setModalState("inputData")}
        >
          Next
        </Button>
      </ModalFooter>
    </>
  );
};

const ModalBodyInputData = ({
  form,
  setModalState,
  client,
}: {
  form: UseFormReturn<AddContractSubscriptionForm>;
  setModalState: Dispatch<SetStateAction<"inputContract" | "inputData">>;
  client: ThirdwebClient;
}) => {
  const processEventLogsDisclosure = useDisclosure({
    defaultIsOpen: form.getValues("processEventLogs"),
  });
  const processTransactionReceiptsDisclosure = useDisclosure({
    defaultIsOpen: form.getValues("processTransactionReceipts"),
  });
  const [shouldFilterEvents, setShouldFilterEvents] = useState(false);
  const [shouldFilterFunctions, setShouldFilterFunctions] = useState(false);

  const processEventLogs = form.watch("processEventLogs");
  const filterEvents = form.watch("filterEvents");
  const processTransactionReceipts = form.watch("processTransactionReceipts");
  const filterFunctions = form.watch("filterFunctions");

  // Invalid states:
  // - Neither logs nor receipts are selected.
  // - Logs are selected but filtering on 0 event names.
  // - Receipts are selected but filtering on 0 function names.
  const isInputDataFormInvalid =
    (!processEventLogs && !processTransactionReceipts) ||
    (processEventLogs && shouldFilterEvents && filterEvents.length === 0) ||
    (processTransactionReceipts &&
      shouldFilterFunctions &&
      filterFunctions.length === 0);

  return (
    <>
      <ModalBody>
        <div className="flex flex-col gap-4">
          <Text>
            Select the data type to process.
            <br />
            Events logs are arbitrary data triggered by a smart contract call.
            <br />
            Transaction receipts contain details about the blockchain execution.
          </Text>

          <FormControl>
            <FormLabel>Processed Data</FormLabel>

            <div className="flex flex-col gap-2">
              <CheckboxWithLabel>
                <Checkbox
                  checked={form.watch("processEventLogs")}
                  onCheckedChange={(val) => {
                    const checked = !!val;
                    form.setValue("processEventLogs", checked);
                    if (checked) {
                      processEventLogsDisclosure.onOpen();
                    } else {
                      processEventLogsDisclosure.onClose();
                    }
                  }}
                />
                <span>Event Logs</span>
              </CheckboxWithLabel>
              {/* Shows all/specific events if processing event logs */}
              <Collapse in={processEventLogsDisclosure.isOpen}>
                <div className="flex flex-col gap-2 px-4">
                  <RadioGroup
                    defaultValue="false"
                    onChange={(val: "false" | "true") => {
                      if (val === "true") {
                        setShouldFilterEvents(true);
                      } else {
                        setShouldFilterEvents(false);
                        form.setValue("filterEvents", []);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <Radio value="false">
                        <Text>All events</Text>
                      </Radio>
                      <Radio value="true">
                        <Text>
                          Specific events{" "}
                          {!!filterEvents.length &&
                            `(${filterEvents.length} selected)`}
                        </Text>
                      </Radio>
                      {/* List event names to select */}
                      <Collapse in={shouldFilterEvents}>
                        <FilterSelector
                          abiItemType="event"
                          client={client}
                          filter={filterEvents}
                          form={form}
                          setFilter={(value) =>
                            form.setValue("filterEvents", value)
                          }
                        />
                      </Collapse>
                    </div>
                  </RadioGroup>
                </div>
              </Collapse>

              <CheckboxWithLabel>
                <Checkbox
                  checked={form.watch("processTransactionReceipts")}
                  onCheckedChange={(val) => {
                    const checked = !!val;
                    form.setValue("processTransactionReceipts", checked);
                    if (checked) {
                      processTransactionReceiptsDisclosure.onOpen();
                    } else {
                      processTransactionReceiptsDisclosure.onClose();
                    }
                  }}
                />
                <span>Transaction Receipts</span>
              </CheckboxWithLabel>
              {/* Shows all/specific functions if processing transaction receipts */}
              <Collapse in={processTransactionReceiptsDisclosure.isOpen}>
                <div className="flex flex-col gap-2 px-4">
                  <RadioGroup
                    defaultValue="false"
                    onChange={(val: "false" | "true") => {
                      if (val === "true") {
                        setShouldFilterFunctions(true);
                      } else {
                        setShouldFilterFunctions(false);
                        form.setValue("filterFunctions", []);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <Radio value="false">
                        <Text>All functions</Text>
                      </Radio>
                      <Radio value="true">
                        <Text>
                          Specific functions{" "}
                          {!!filterFunctions.length &&
                            `(${filterFunctions.length} selected)`}
                        </Text>
                      </Radio>
                      {/* List function names to select */}
                      <Collapse in={shouldFilterFunctions}>
                        <FilterSelector
                          abiItemType="function"
                          client={client}
                          filter={filterFunctions}
                          form={form}
                          setFilter={(value) =>
                            form.setValue("filterFunctions", value)
                          }
                        />
                      </Collapse>
                    </div>
                  </RadioGroup>
                </div>
              </Collapse>
            </div>
          </FormControl>
        </div>
      </ModalBody>

      <ModalFooter as={Flex} gap={3}>
        <Button
          onClick={() => setModalState("inputContract")}
          type="button"
          variant="ghost"
        >
          Back
        </Button>
        <Button
          colorScheme="primary"
          isDisabled={isInputDataFormInvalid}
          type="submit"
        >
          Add
        </Button>
      </ModalFooter>
    </>
  );
};

const FilterSelector = ({
  abiItemType,
  form,
  filter,
  setFilter,
  client,
}: {
  abiItemType: "function" | "event";

  form: UseFormReturn<AddContractSubscriptionForm>;
  filter: string[];
  setFilter: (value: string[]) => void;
  client: ThirdwebClient;
}) => {
  const chain = useV5DashboardChain(form.getValues("chainId"));
  const address = form.getValues("contractAddress");
  const contract = useMemo(
    () =>
      chain
        ? getContract({
            address,
            chain,
            client,
          })
        : undefined,
    [chain, client, address],
  );

  const abiQuery = useResolveContractAbi(contract);

  const abiItems = useMemo(() => {
    if (!abiQuery.data) {
      return {
        events: [],
        readFunctions: [],
        writeFunctions: [],
      };
    }
    const readFunctions: string[] = [];
    const writeFunctions: string[] = [];
    const events: string[] = [];
    for (const abiItem of abiQuery.data) {
      if (abiItem.type === "function") {
        if (
          abiItem.stateMutability === "pure" ||
          abiItem.stateMutability === "view"
        ) {
          readFunctions.push(abiItem.name);
        } else {
          writeFunctions.push(abiItem.name);
        }
      } else if (abiItem.type === "event") {
        events.push(abiItem.name);
      }
    }
    return {
      events: [...new Set(events)].sort(),
      readFunctions: [...new Set(readFunctions)].sort(),
      writeFunctions: [...new Set(writeFunctions)].sort(),
    };
  }, [abiQuery.data]);

  const filterNames = useMemo(() => {
    switch (abiItemType) {
      case "function": {
        return abiItems.writeFunctions;
      }
      case "event": {
        return abiItems.events;
      }
      default: {
        return [];
      }
    }
  }, [abiItemType, abiItems.events, abiItems.writeFunctions]);

  return (
    <Card>
      {abiQuery.isPending ? (
        <Spinner size="sm" />
      ) : filterNames.length === 0 ? (
        <Text>
          Cannot resolve the contract definition. Filters are unavailable.
        </Text>
      ) : (
        <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
          {filterNames.map((name) => (
            <CheckboxWithLabel key={name}>
              <Checkbox
                checked={filter.includes(name)}
                onCheckedChange={(val) => {
                  if (val) {
                    setFilter([...filter, name]);
                  } else {
                    setFilter(filter.filter((item) => item !== name));
                  }
                }}
              />
              <span>{name}</span>
            </CheckboxWithLabel>
          ))}
        </div>
      )}
    </Card>
  );
};
