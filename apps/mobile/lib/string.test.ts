import { describe, expect, test } from "@jest/globals";

import { capitalize } from "./string";

describe("capitalize", () => {
	test("capitalizes first letter", () => {
		expect(capitalize("hello")).toBe("Hello");
	});

	test("keeps empty string", () => {
		expect(capitalize("")).toBe("");
	});
});
