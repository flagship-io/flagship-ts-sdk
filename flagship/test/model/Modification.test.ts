import { assertEquals, stub } from "../../deps.ts";
import { Modification } from "../../src/model/Modification.ts";

Deno.test("Test model Modification", () => {
  const key = "key";
  const campaignId = "campaignId";
  const variationGroupId = "variationGroupId";
  const variationId = "variationId";
  const isReference = true;
  const value = "value";
  const modification = new Modification(
    key,
    campaignId,
    variationGroupId,
    variationId,
    isReference,
    value
  );
  assertEquals(modification.key, key);
  assertEquals(modification.campaignId, campaignId);
  assertEquals(modification.variationGroupId, variationGroupId);
  assertEquals(modification.variationId, variationId);
  assertEquals(modification.isReference, isReference);
  assertEquals(modification.value, value);
});
