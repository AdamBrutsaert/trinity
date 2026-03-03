import { fireEvent, render } from "@testing-library/react-native";

import { CartSummaryCard } from "@/components/cart-summary-card";

describe("CartSummaryCard", () => {
	it("renders singular/plural item label", () => {
		const onPurchase = jest.fn();

		const { getByText, rerender } = render(
			<CartSummaryCard
				totalCents={1234}
				itemsCount={1}
				onPurchase={onPurchase}
			/>,
		);

		expect(getByText("1 item")).toBeTruthy();

		rerender(
			<CartSummaryCard
				totalCents={1234}
				itemsCount={2}
				onPurchase={onPurchase}
			/>,
		);

		expect(getByText("2 items")).toBeTruthy();
	});

	it("disables Purchase when empty", () => {
		const onPurchase = jest.fn();
		const { getByText } = render(
			<CartSummaryCard totalCents={0} itemsCount={0} onPurchase={onPurchase} />,
		);

		fireEvent.press(getByText("Purchase"));
		expect(onPurchase).not.toHaveBeenCalled();
	});

	it("calls onPurchase when pressed", () => {
		const onPurchase = jest.fn();
		const { getByText } = render(
			<CartSummaryCard totalCents={999} itemsCount={3} onPurchase={onPurchase} />,
		);

		fireEvent.press(getByText("Purchase"));
		expect(onPurchase).toHaveBeenCalledTimes(1);
	});
});
