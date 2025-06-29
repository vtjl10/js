"use client";

import type { UseFormReturn } from "react-hook-form";
import type { NFTInput } from "thirdweb/utils";
import { FormFieldSetup } from "@/components/blocks/FormFieldSetup";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type AdvancedNFTMetadataFormGroupValues = {
  image?: NFTInput["image"];
  animation_url?: NFTInput["animation_url"];
  background_color?: NFTInput["background_color"];
  external_url?: NFTInput["external_url"];
};

export function AdvancedNFTMetadataFormGroup<
  T extends AdvancedNFTMetadataFormGroupValues,
>(props: { form: UseFormReturn<T> }) {
  // T contains all properties of AdvancedNFTMetadataFormGroupValues, so this is a-ok
  const form =
    props.form as unknown as UseFormReturn<AdvancedNFTMetadataFormGroupValues>;

  const externalUrl = form.watch("external_url");
  const externalIsTextFile =
    externalUrl instanceof File &&
    (externalUrl.type.includes("text") || externalUrl.type.includes("pdf"));

  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={form.control}
        name="background_color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Background Color</FormLabel>
            <FormControl>
              {/* # + 6 */}
              <Input maxLength={7} {...field} />
            </FormControl>
            <FormDescription>
              Must be a six-character hexadecimal with a pre-pended #.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image URI</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
              />
            </FormControl>
            <FormDescription>
              If you already have your NFT image pre-uploaded, you can set the
              URL or URI here.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="animation_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Animation URI</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
              />
            </FormControl>
            <FormDescription>
              If you already have your NFT Animation URL pre-uploaded, you can
              set the URL or URI here.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {!externalIsTextFile && (
        <FormFieldSetup
          errorMessage={form.formState.errors.external_url?.message}
          helperText="This is the URL that will appear below the asset's image on OpenSea and will allow users to leave OpenSea and view the item on your site."
          htmlFor="external-url"
          isRequired={false}
          label="External URL"
        >
          <Input
            placeholder="https://"
            {...form.register("external_url")}
            type="url"
          />
        </FormFieldSetup>
      )}
    </div>
  );
}
