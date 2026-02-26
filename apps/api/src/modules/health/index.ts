import Elysia from "elysia";

function helloWorldRoute() {
	return new Elysia().get("/", "Hello, world!");
}

export function createHealthModule() {
	return new Elysia({ name: "health", tags: ["health"] }).use(
		helloWorldRoute(),
	);
}
