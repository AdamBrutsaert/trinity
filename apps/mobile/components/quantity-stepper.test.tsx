import { fireEvent, render } from "@testing-library/react-native";

import { QuantityStepper } from "@/components/quantity-stepper";

describe("QuantityStepper", () => {
	it("disables decrement at minValue", () => {
		const onChange = jest.fn();

		const { getByText } = render(
			<QuantityStepper value={1} minValue={1} onChange={onChange} />,
		);

		fireEvent.press(getByText("−"));
		expect(onChange).not.toHaveBeenCalled();
	});

	it("increments and decrements when allowed", () => {
		let value = 2;
		const onChange = jest.fn((next: number) => {
			value = next;
		});

		const { getByText, rerender } = render(
			<QuantityStepper value={value} minValue={1} onChange={onChange} />,
		);

		fireEvent.press(getByText("+"));
		expect(onChange).toHaveBeenLastCalledWith(3);
		rerender(<QuantityStepper value={value} minValue={1} onChange={onChange} />);

		fireEvent.press(getByText("−"));
		expect(onChange).toHaveBeenLastCalledWith(2);
	});
});
