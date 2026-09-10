import { describe, expect, it } from "vitest";

import { normalizeToolParameters } from "../llm/aiSdk";

/**
 * Google rejects the entire request when an array parameter omits `items`,
 * so a single malformed MCP tool schema takes down every message in the
 * conversation. These are the shapes DingDuff actually ships.
 */
describe("normalizeToolParameters", () => {
    it("fills missing items on an id array with integers", () => {
        const normalized = normalizeToolParameters({
            type: "object",
            properties: { cluster_ids: { type: "array" } },
            required: ["cluster_ids"],
        }) as Record<string, never>;

        expect(normalized.properties).toEqual({
            cluster_ids: { type: "array", items: { type: "integer" } },
        });
        expect(normalized.required).toEqual(["cluster_ids"]);
    });

    it("fills missing items on a non-id array with strings", () => {
        const normalized = normalizeToolParameters({
            type: "object",
            properties: {
                exclude_courts: { type: "array" },
                flag_terms: { type: "array" },
            },
        }) as Record<string, never>;

        expect(normalized.properties).toEqual({
            exclude_courts: { type: "array", items: { type: "string" } },
            flag_terms: { type: "array", items: { type: "string" } },
        });
    });

    it("leaves a declared item type alone", () => {
        const schema = {
            type: "object",
            properties: {
                citations: { type: "array", items: { type: "string" } },
            },
        };

        expect(normalizeToolParameters(schema)).toEqual(schema);
    });

    it("reaches arrays nested in objects and unions", () => {
        const normalized = normalizeToolParameters({
            type: "object",
            properties: {
                filter: {
                    type: "object",
                    properties: { tiers: { type: "array" } },
                },
                target: {
                    anyOf: [{ type: "string" }, { type: "array" }],
                },
            },
        }) as { properties: Record<string, Record<string, never>> };

        expect(normalized.properties.filter.properties).toEqual({
            tiers: { type: "array", items: { type: "string" } },
        });
        expect(normalized.properties.target.anyOf).toEqual([
            { type: "string" },
            { type: "array", items: { type: "string" } },
        ]);
    });

    it("does not mutate the caller's schema", () => {
        const schema = {
            type: "object",
            properties: { document_ids: { type: "array" } },
        };
        normalizeToolParameters(schema);

        expect(schema.properties.document_ids).toEqual({ type: "array" });
    });

    it("passes through non-schema values untouched", () => {
        expect(normalizeToolParameters(null)).toBeNull();
        expect(normalizeToolParameters("text")).toBe("text");
    });
});
