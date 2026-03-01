import React from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { styles } from "@/styles/components/profile-text-field.styles";

export function ProfileTextField({
	label,
	value,
	onChangeText,
	placeholder,
	disabled,
	...props
}: {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
} & Omit<
	TextInputProps,
	"value" | "onChangeText" | "placeholder" | "editable"
>) {
	return (
		<View style={styles.field}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				style={[styles.input, disabled ? styles.inputDisabled : null]}
				placeholder={placeholder}
				placeholderTextColor="#999"
				value={value}
				onChangeText={onChangeText}
				editable={!disabled}
				{...props}
			/>
		</View>
	);
}
