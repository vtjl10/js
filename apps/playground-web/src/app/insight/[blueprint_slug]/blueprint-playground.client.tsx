"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
  PlayIcon,
} from "lucide-react";
import type { OpenAPIV3 } from "openapi-types";
import { useEffect, useMemo, useState } from "react";
import {
  type ControllerRenderProps,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import { CodeClient, CodeLoading } from "@/components/code/code.client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollShadow } from "@/components/ui/ScrollShadow/ScrollShadow";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolTipLabel } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MultiNetworkSelector } from "../../../components/blocks/NetworkSelectors";
import type { BlueprintParameter, BlueprintPathMetadata } from "../utils";
import { AggregateParameterInput } from "./aggregate-parameter-input.client";

export function BlueprintPlayground(props: {
  metadata: BlueprintPathMetadata;
  backLink: string;
  clientId: string;
  path: string;
  supportedChainIds: number[];
  domain: string;
}) {
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const requestMutation = useMutation({
    mutationFn: async (url: string) => {
      const controller = new AbortController();
      setAbortController(controller);
      const start = performance.now();
      try {
        const res = await fetch(url, {
          headers: {
            "x-client-id": props.clientId,
          },
          signal: controller.signal,
        });
        return {
          data: await res.text(),
          status: res.status,
          time: performance.now() - start,
        };
      } catch (e) {
        const time = performance.now() - start;
        if (e instanceof Error) {
          return {
            data: e.message,
            time: time,
          };
        }
        return {
          data: "Failed to fetch",
          time: time,
        };
      }
    },
  });

  return (
    <BlueprintPlaygroundUI
      abortRequest={() => {
        if (abortController) {
          // just abort it - don't set a new controller
          abortController.abort();
        }
      }}
      backLink={props.backLink}
      clientId={props.clientId}
      domain={props.domain}
      isPending={requestMutation.isPending}
      metadata={props.metadata}
      onRun={(url) => {
        requestMutation.mutate(url);
      }}
      path={props.path}
      response={
        abortController?.signal.aborted ? undefined : requestMutation.data
      }
      supportedChainIds={props.supportedChainIds}
    />
  );
}

function modifyParametersForPlayground(_parameters: BlueprintParameter[]) {
  const parameters = [..._parameters];

  // make chain query param required - its not required in open api spec - because it either has to be set in subdomain or as a query param
  const chainIdParameter = parameters.find((p) => p.name === "chain_id");
  if (chainIdParameter) {
    chainIdParameter.required = true;
  }

  // remove the client id parameter if it is present - we will always replace the parameter with project's client id
  const clientIdParameterIndex = parameters.findIndex(
    (p) => p.name === "clientId",
  );
  if (clientIdParameterIndex !== -1) {
    parameters.splice(clientIdParameterIndex, 1);
  }

  // remove the chain parameter if it is present
  const chainParameterIndex = parameters.findIndex((p) => p.name === "chain");
  if (chainParameterIndex !== -1) {
    parameters.splice(chainParameterIndex, 1);
  }

  return parameters;
}

function BlueprintPlaygroundUI(props: {
  backLink: string;
  isPending: boolean;
  onRun: (url: string) => void;
  response:
    | {
        time: number;
        data: undefined | string;
        status?: number;
      }
    | undefined;
  clientId: string;
  abortRequest: () => void;
  domain: string;
  path: string;
  metadata: BlueprintPathMetadata;
  supportedChainIds: number[];
}) {
  const parameters = useMemo(() => {
    const filteredParams = props.metadata.parameters?.filter(
      isOpenAPIV3ParameterObject,
    );
    return modifyParametersForPlayground(filteredParams || []);
  }, [props.metadata.parameters]);

  const formSchema = useMemo(() => {
    return createParametersFormSchema(parameters);
  }, [parameters]);

  const defaultValues = useMemo(() => {
    const values: Record<string, string | number | string[] | number[]> = {};
    for (const param of parameters) {
      if (param.schema && "type" in param.schema && param.schema.default) {
        values[param.name] = param.schema.default;
      } else if (param.name === "filter_block_timestamp_gte") {
        values[param.name] = Math.floor(
          (Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) / 1000,
        );
      } else if (param.name === "chain_id") {
        values[param.name] = [];
      } else {
        values[param.name] = "";
      }
    }
    return values;
  }, [parameters]);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: defaultValues,
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const url = createBlueprintUrl({
      clientId: props.clientId,
      domain: props.domain,
      intent: "run",
      parameters: parameters,
      path: props.path,
      values: values,
    });

    props.onRun(url);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex grow flex-col">
          <div className="flex grow flex-col">
            <div className="flex grow flex-col overflow-hidden rounded-xl border bg-card">
              <PlaygroundHeader
                clientId={props.clientId}
                domain={props.domain}
                getFormValues={() => form.getValues()}
                isPending={props.isPending}
                parameters={parameters}
                path={props.path}
              />
              <div className="grid grow grid-cols-1 lg:grid-cols-2">
                <div className="flex max-h-[500px] grow flex-col max-sm:border-b lg:max-h-[740px] lg:border-r">
                  <RequestConfigSection
                    domain={props.domain}
                    form={form}
                    parameters={parameters}
                    path={props.path}
                    supportedChainIds={props.supportedChainIds}
                  />
                </div>

                <div className="flex h-[500px] grow flex-col lg:h-[740px]">
                  <ResponseSection
                    abortRequest={props.abortRequest}
                    isPending={props.isPending}
                    response={props.response}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

function PlaygroundHeader(props: {
  parameters: BlueprintParameter[];
  isPending: boolean;
  getFormValues: () => Record<string, string>;
  clientId: string;
  domain: string;
  path: string;
}) {
  const [hasCopied, setHasCopied] = useState(false);
  return (
    <div className="border-b px-4 py-4 lg:flex lg:justify-center lg:py-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-hidden rounded-xl border bg-muted/50 p-2 lg:justify-center">
          {/* copy url */}
          <Button
            className="hover:accent h-auto w-auto p-1"
            onClick={() => {
              setHasCopied(true);
              const url = createBlueprintUrl({
                clientId: props.clientId,
                domain: props.domain,
                intent: "copy",
                parameters: props.parameters,
                path: props.path,
                values: props.getFormValues(),
              });

              setTimeout(() => {
                setHasCopied(false);
              }, 500);
              navigator.clipboard.writeText(url);
            }}
            variant="ghost"
          >
            {hasCopied ? (
              <CheckIcon className="size-4 text-green-500" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </Button>

          {/* vertical line */}
          <div className="h-6 w-[1px] bg-border" />

          {/* domain + path */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="rounded-xl bg-muted-foreground/10 px-2.5 py-1 font-mono text-xs lg:text-sm">
              <span className="hidden lg:inline">{props.domain}</span>
              <span className="lg:hidden">...</span>
            </div>
            <div className="truncate font-mono text-xs lg:text-sm">
              {props.path}
            </div>
          </div>

          {/* Run */}
          <Button
            className="ml-2 hidden h-auto w-auto gap-1.5 p-1 px-2 lg:flex"
            disabled={props.isPending}
            type="submit"
          >
            {props.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
            Run
          </Button>
        </div>

        <Button
          className="gap-2 rounded-lg lg:hidden"
          disabled={props.isPending}
          size="sm"
          type="submit"
        >
          {props.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
          Run
        </Button>
      </div>
    </div>
  );
}

function RequestConfigSection(props: {
  parameters: BlueprintParameter[];
  form: ParametersForm;
  domain: string;
  path: string;
  supportedChainIds: number[];
}) {
  const { pathVariables, queryParams, filterQueryParams } = useMemo(() => {
    const pathVariables: OpenAPIV3.ParameterObject[] = [];
    const queryParams: OpenAPIV3.ParameterObject[] = [];
    const filterQueryParams: OpenAPIV3.ParameterObject[] = [];

    for (const param of props.parameters) {
      if (param.in === "path") {
        pathVariables.push(param);
      }

      if (param.in === "query") {
        if (param.name.startsWith("filter_")) {
          filterQueryParams.push(param);
        } else {
          queryParams.push(param);
        }
      }
    }

    return {
      filterQueryParams,
      pathVariables,
      queryParams,
    };
  }, [props.parameters]);

  const showError =
    !props.form.formState.isValid &&
    props.form.formState.isDirty &&
    props.form.formState.isSubmitted;

  return (
    <div className="flex grow flex-col overflow-hidden">
      <div className="flex min-h-[60px] items-center justify-between gap-2 border-b p-4 text-sm">
        <div className="flex items-center gap-2">
          <ArrowUpRightIcon className="size-5" />
          Request
        </div>
        {showError && <Badge variant="destructive">Invalid Request</Badge>}
      </div>

      <ScrollShadow className="flex-1" scrollableClassName="max-h-full">
        {pathVariables.length > 0 && (
          <ParameterSection
            className="border-b"
            domain={props.domain}
            form={props.form}
            parameters={pathVariables}
            path={props.path}
            supportedChainIds={props.supportedChainIds}
            title="Path Variables"
          />
        )}

        {queryParams.length > 0 && (
          <ParameterSection
            className="border-b"
            domain={props.domain}
            form={props.form}
            parameters={queryParams}
            path={props.path}
            supportedChainIds={props.supportedChainIds}
            title="Query Parameters"
          />
        )}

        {filterQueryParams.length > 0 && (
          <ParameterSection
            domain={props.domain}
            form={props.form}
            parameters={filterQueryParams}
            path={props.path}
            supportedChainIds={props.supportedChainIds}
            title="Filter Query Parameters"
          />
        )}
      </ScrollShadow>
    </div>
  );
}

type ParametersForm = UseFormReturn<{
  [x: string]: string | number | string[] | number[];
}>;

function ParameterSection(props: {
  parameters: BlueprintParameter[];
  title: string;
  form: ParametersForm;
  domain: string;
  path: string;
  supportedChainIds: number[];
  className?: string;
}) {
  return (
    <div className={cn("p-4 py-6", props.className)}>
      <h3 className="mb-3 font-medium text-sm"> {props.title} </h3>
      <div className="overflow-hidden rounded-lg border">
        {props.parameters.map((param, i) => {
          const description =
            param.schema && "type" in param.schema
              ? param.schema.description
              : undefined;

          const example =
            param.schema && "type" in param.schema
              ? param.schema.example
              : undefined;
          const exampleToShow =
            typeof example === "string" || typeof example === "number"
              ? example
              : undefined;

          const showTip = description !== undefined || example !== undefined;

          const hasError = !!props.form.formState.errors[param.name];

          return (
            <FormField
              control={props.form.control}
              key={param.name}
              name={param.name}
              render={({ field }) => (
                <FormItem
                  className={cn(
                    "space-y-0",
                    i !== props.parameters.length - 1 && "border-b",
                  )}
                >
                  <div
                    className={cn(
                      "grid items-center",
                      param.name === "chain_id"
                        ? "grid-cols-1 lg:grid-cols-2"
                        : "grid-cols-2",
                    )}
                    key={param.name}
                  >
                    <div className="flex h-full flex-row flex-wrap items-center justify-between gap-1 border-r px-3 py-2">
                      <div className="font-medium font-mono text-sm">
                        {param.name}
                      </div>
                      {param.required && (
                        <Badge
                          className="px-2 text-muted-foreground"
                          variant="secondary"
                        >
                          Required
                        </Badge>
                      )}
                    </div>
                    <div className="relative">
                      {param.name === "chain_id" ? (
                        <MultiNetworkSelector
                          chainIds={
                            props.supportedChainIds.length > 0
                              ? props.supportedChainIds
                              : undefined
                          }
                          className="rounded-none border-0 border-t lg:border-none"
                          onChange={(chainIds) => {
                            props.form.setValue("chain_id", chainIds, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          popoverContentClassName="min-w-[calc(100vw-20px)] lg:min-w-[500px]"
                          selectedBadgeClassName="bg-background"
                          selectedChainIds={
                            props.form.watch("chain_id") as number[]
                          }
                        />
                      ) : !Array.isArray(field.value) ? (
                        <>
                          <ParameterInput
                            endpointPath={props.path}
                            field={{
                              ...field,
                              value: field.value,
                            }}
                            hasError={hasError}
                            param={param}
                            placeholder={param.description || param.name}
                            showTip={showTip}
                          />

                          {showTip && (
                            <ToolTipLabel
                              contentClassName="max-w-[100vw] break-all"
                              hoverable
                              label={
                                <div className="flex flex-col gap-2">
                                  {description && (
                                    <p className="text-foreground">
                                      {param.name === "aggregate"
                                        ? "Aggregation(s). You can type in multiple, separated by a comma, or select from the presets"
                                        : description}
                                    </p>
                                  )}

                                  {exampleToShow !== undefined && (
                                    <div>
                                      <p className="mb-1 text-muted-foreground">
                                        Example:{" "}
                                        <span className="font-mono">
                                          {param.name === "aggregate"
                                            ? "count() AS count_all, countDistinct(address) AS unique_addresses"
                                            : exampleToShow}
                                        </span>
                                      </p>
                                    </div>
                                  )}
                                </div>
                              }
                            >
                              <Button
                                asChild
                                className="-translate-y-1/2 absolute top-1/2 right-2 hidden h-auto w-auto p-1.5 text-muted-foreground opacity-50 hover:opacity-100 lg:flex"
                                variant="ghost"
                              >
                                <div>
                                  <InfoIcon className="size-4" />
                                </div>
                              </Button>
                            </ToolTipLabel>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <FormMessage className="mt-0 border-destructive-text border-t px-3 py-2" />
                </FormItem>
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function ParameterInput(props: {
  param: OpenAPIV3.ParameterObject;
  field: ControllerRenderProps<
    {
      [x: string]: string | number;
    },
    string
  >;
  showTip: boolean;
  hasError: boolean;
  placeholder: string;
  endpointPath: string;
}) {
  const { param, field, showTip, hasError, placeholder } = props;

  if (param.schema && "type" in param.schema && param.schema.enum) {
    const { value, onChange, ...restField } = field;
    return (
      <Select
        {...restField}
        onValueChange={(v) => {
          onChange({ target: { value: v } });
        }}
        value={value.toString()}
      >
        <SelectTrigger
          chevronClassName="hidden"
          className={cn(
            "border-none bg-transparent pr-10 font-mono focus:ring-0 focus:ring-offset-0",
            value === "" && "text-muted-foreground",
          )}
        >
          <SelectValue placeholder="Select" />
        </SelectTrigger>

        <SelectContent className="font-mono">
          {param.schema.enum.map((val) => {
            return (
              <SelectItem key={val} value={val}>
                {val}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  if (param.name === "aggregate") {
    return (
      <AggregateParameterInput
        endpointPath={props.endpointPath}
        field={field}
        placeholder={placeholder}
        showTip={showTip}
      />
    );
  }

  return (
    <Input
      {...field}
      className={cn(
        "h-auto truncate rounded-none border-0 bg-transparent py-3 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0",
        showTip && "lg:pr-10",
        hasError && "text-destructive-text",
      )}
      placeholder={placeholder}
    />
  );
}

function formatMilliseconds(ms: number) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function ResponseSection(props: {
  isPending: boolean;
  response:
    | { data: undefined | string; status?: number; time: number }
    | undefined;
  abortRequest: () => void;
}) {
  const formattedData = useMemo(() => {
    if (!props.response?.data) return undefined;
    try {
      return JSON.stringify(JSON.parse(props.response.data), null, 2);
    } catch {
      return props.response.data;
    }
  }, [props.response]);

  return (
    <div className="flex h-full grow flex-col">
      <div className="flex min-h-[60px] items-center justify-between gap-2 border-b p-4 text-sm">
        <div className="flex items-center gap-2">
          <ArrowDownLeftIcon className="size-5" />
          Response
          {props.isPending && <ElapsedTimeCounter />}
          {props.response?.time && !props.isPending && (
            <span className="text-muted-foreground">
              {formatMilliseconds(props.response.time)}
            </span>
          )}
        </div>
        {!props.isPending && props.response?.status && (
          <Badge
            variant={
              props.response.status >= 200 && props.response.status < 300
                ? "success"
                : "destructive"
            }
          >
            {props.response.status}
          </Badge>
        )}
      </div>

      {props.isPending && (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Spinner className="size-14 text-muted-foreground" />
          <Button onClick={props.abortRequest} size="sm" variant="ghost">
            Cancel
          </Button>
        </div>
      )}

      {!props.isPending && !props.response && (
        <div className="flex grow flex-col items-center justify-center p-4">
          <div>
            <div className="flex justify-center">
              <div className="rounded-xl border p-1">
                <div className="rounded-lg border bg-card p-1.5">
                  <PlayIcon className="size-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-center">Click Run to start a request</p>
          </div>
        </div>
      )}

      {!props.isPending && props.response && (
        <CodeClient
          className="rounded-none border-none bg-transparent"
          code={formattedData || ""}
          lang="json"
          loader={<CodeLoading />}
          scrollableClassName="h-full"
          scrollableContainerClassName="h-full"
          // shadowColor="hsl(var(--muted)/50%)"
        />
      )}
    </div>
  );
}

function openAPIV3ParamToZodFormSchema(
  schema: BlueprintParameter["schema"],
  isRequired: boolean,
): z.ZodTypeAny | undefined {
  if (!schema) {
    return;
  }

  if ("anyOf" in schema) {
    const anyOf = schema.anyOf;
    if (!anyOf) {
      return;
    }
    const anySchemas = anyOf
      .map((s) => openAPIV3ParamToZodFormSchema(s, isRequired))
      .filter((x) => !!x);
    // @ts-expect-error - Its ok, z.union is expecting tuple type but we have array
    return z.union(anySchemas);
  }

  if (!("type" in schema)) {
    return;
  }

  // if enum values
  const enumValues = schema.enum;
  if (enumValues) {
    const enumSchema = z.enum(
      // @ts-expect-error - Its correct
      enumValues,
    );

    if (isRequired) {
      return enumSchema;
    }

    return enumSchema.or(z.literal(""));
  }

  switch (schema.type) {
    case "integer": {
      const intSchema = z.coerce
        .number({
          message: "Must be an integer",
        })
        .int({
          message: "Must be an integer",
        });
      return isRequired
        ? intSchema.min(1, {
            message: "Required",
          })
        : intSchema.optional();
    }

    case "number": {
      const numberSchema = z.coerce.number();
      return isRequired
        ? numberSchema.min(1, {
            message: "Required",
          })
        : numberSchema.optional();
    }

    case "boolean": {
      const booleanSchema = z.coerce.boolean();
      return isRequired ? booleanSchema : booleanSchema.optional();
    }

    case "array": {
      if ("type" in schema.items) {
        let itemSchema: z.ZodTypeAny | undefined;
        if (schema.items.type === "number") {
          itemSchema = z.number();
        } else if (schema.items.type === "integer") {
          itemSchema = z.number().int();
        } else if (schema.items.type === "string") {
          itemSchema = z.string();
        }

        if (itemSchema) {
          const arraySchema = isRequired
            ? z.array(itemSchema).min(1, { message: "Required" })
            : z.array(itemSchema);
          const arrayOrSingleItemSchema = z.union([arraySchema, itemSchema]);
          return isRequired
            ? arrayOrSingleItemSchema
            : arrayOrSingleItemSchema.optional();
        }
      }
      break;
    }

    // everything else - just accept it as a string;
    default: {
      const stringSchema = z.string();
      return isRequired
        ? stringSchema.min(1, {
            message: "Required",
          })
        : stringSchema.optional();
    }
  }
}

function createParametersFormSchema(parameters: BlueprintParameter[]) {
  const shape: z.ZodRawShape = {};
  for (const param of parameters) {
    if (param.deprecated) {
      continue;
    }
    const paramSchema = openAPIV3ParamToZodFormSchema(
      param.schema,
      !!param.required,
    );
    if (paramSchema) {
      shape[param.name] = paramSchema;
    } else {
      shape[param.name] = param.required
        ? z.string().min(1, { message: "Required" })
        : z.string();
    }
  }

  return z.object(shape);
}

function createBlueprintUrl(options: {
  parameters: BlueprintParameter[];
  values: Record<string, string>;
  clientId: string;
  domain: string;
  path: string;
  intent: "copy" | "run";
}) {
  const { parameters, domain, path, values, clientId } = options;

  let url = `${domain}${path}`;
  // loop over the values and replace {x} or :x  with the actual values for paths
  // and add query parameters
  const pathVariables = parameters.filter((param) => param.in === "path");

  const queryParams = parameters.filter((param) => param.in === "query");

  for (const parameter of pathVariables) {
    const value = values[parameter.name];
    if (value) {
      url = url.replace(`{${parameter.name}}`, value);
      url = url.replace(`:${parameter.name}`, value);
    }
  }

  const searchParams = new URLSearchParams();
  for (const parameter of queryParams) {
    const value = values[parameter.name];
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) {
          searchParams.append(parameter.name, v);
        }
      } else {
        searchParams.append(parameter.name, value);
      }
    }
  }

  // add client Id search param
  if (options.intent === "run") {
    searchParams.append("clientId", clientId);
  } else {
    searchParams.append("clientId", "YOUR_THIRDWEB_CLIENT_ID");
  }

  if (searchParams.toString()) {
    url = `${url}?${searchParams.toString()}`;
  }

  return url;
}

function ElapsedTimeCounter() {
  const [ms, setMs] = useState(0);

  // eslint-disable-next-line no-restricted-syntax
  useEffect(() => {
    const internal = 100;
    const id = setInterval(() => {
      setMs((prev) => prev + internal);
    }, internal);

    return () => clearInterval(id);
  }, []);

  return (
    <span className="fade-in-0 animate-in text-muted-foreground text-sm duration-300">
      {formatMilliseconds(ms)}
    </span>
  );
}

function isOpenAPIV3ParameterObject(
  x: OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject,
): x is OpenAPIV3.ParameterObject {
  return !("$ref" in x);
}
