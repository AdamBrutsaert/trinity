import { fireEvent, render } from "@testing-library/react-native";

import { CartPurchaseBar } from "@/components/cart-purchase-bar";

describe("CartPurchaseBar", () => {
	it("renders total and currency", () => {
		const onPurchase = jest.fn();
		const { getByText } = render(
			<CartPurchaseBar
				totalCents={1234}
				itemsCount={2}
				bottomInset={0}
				onLayout={jest.fn()}
				onPurchase={onPurchase}
			/>,
		);

		expect(getByText("TOTAL")).toBeTruthy();
		expect(getByText(/€|EUR/)).toBeTruthy();
	});

	it("disables Purchase when empty", () => {
		const onPurchase = jest.fn();
		const { getByText } = render(
			<CartPurchaseBar
				totalCents={0}
				itemsCount={0}
				bottomInset={0}
				onLayout={jest.fn()}
				onPurchase={onPurchase}
			/>,
		);

		fireEvent.press(getByText("Purchase"));
		expect(onPurchase).not.toHaveBeenCalled();
	});

	it("calls onPurchase when pressed", () => {
		const onPurchase = jest.fn();
		const { getByText } = render(
			<CartPurchaseBar
				totalCents={999}
				itemsCount={1}
				bottomInset={0}
				onLayout={jest.fn()}
				onPurchase={onPurchase}
			/>,
		);

		fireEvent.press(getByText("Purchase"));
		expect(onPurchase).toHaveBeenCalledTimes(1);
	});
});
