import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useAuth } from "@/features/auth/AuthContext";
import { styles } from "@/styles/screens/register.styles";

type FormData = {
	email: string;
	password: string;
	confirmPassword: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
};

export default function RegisterScreen() {
	const router = useRouter();
	const { register } = useAuth();

	const [formData, setFormData] = useState<FormData>({
		email: "",
		password: "",
		confirmPassword: "",
		firstName: "",
		lastName: "",
		phoneNumber: "",
	});
	const [loading, setLoading] = useState(false);

	const updateField = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleRegister = async () => {
		if (
			!formData.email.trim() ||
			!formData.password.trim() ||
			!formData.firstName.trim() ||
			!formData.lastName.trim()
		) {
			Alert.alert("Error", "Please fill in all required fields.");
			return;
		}

		if (!formData.email.includes("@")) {
			Alert.alert("Error", "Please enter a valid email address.");
			return;
		}

		if (formData.password.length < 6) {
			Alert.alert("Error", "Password must be at least 6 characters long.");
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			Alert.alert("Error", "Passwords do not match.");
			return;
		}

		setLoading(true);
		try {
			const result = await register({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName,
				lastName: formData.lastName,
				phoneNumber: formData.phoneNumber || undefined,
			});

			if (!result.success) {
				Alert.alert("Sign-up failed", result.error || "Something went wrong.");
				return;
			}

			router.replace("/");
		} catch (error) {
			Alert.alert("Error", "An unexpected error occurred.");
			console.error("Register error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView behavior="padding" style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.header}>
					<Text style={styles.title}>Sign up</Text>
					<Text style={styles.subtitle}>Create your account</Text>
				</View>

				<View style={styles.formContainer}>
					<View style={styles.inputContainer}>
						<Text style={styles.label}>First name *</Text>
						<TextInput
							style={styles.input}
							placeholder="John"
							placeholderTextColor="#999"
							value={formData.firstName}
							onChangeText={(v) => updateField("firstName", v)}
							autoCapitalize="words"
							editable={!loading}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Last name *</Text>
						<TextInput
							style={styles.input}
							placeholder="Doe"
							placeholderTextColor="#999"
							value={formData.lastName}
							onChangeText={(v) => updateField("lastName", v)}
							autoCapitalize="words"
							editable={!loading}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Email *</Text>
						<TextInput
							style={styles.input}
							placeholder="you@email.com"
							placeholderTextColor="#999"
							value={formData.email}
							onChangeText={(v) => updateField("email", v)}
							autoCapitalize="none"
							keyboardType="email-address"
							editable={!loading}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Phone</Text>
						<TextInput
							style={styles.input}
							placeholder="+33 6 12 34 56 78"
							placeholderTextColor="#999"
							value={formData.phoneNumber}
							onChangeText={(v) => updateField("phoneNumber", v)}
							keyboardType="phone-pad"
							editable={!loading}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Password *</Text>
						<TextInput
							style={styles.input}
							placeholder="••••••••"
							placeholderTextColor="#999"
							value={formData.password}
							onChangeText={(v) => updateField("password", v)}
							secureTextEntry
							autoCapitalize="none"
							editable={!loading}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Confirm password *</Text>
						<TextInput
							style={styles.input}
							placeholder="••••••••"
							placeholderTextColor="#999"
							value={formData.confirmPassword}
							onChangeText={(v) => updateField("confirmPassword", v)}
							secureTextEntry
							autoCapitalize="none"
							editable={!loading}
						/>
					</View>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleRegister}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Sign up</Text>
						)}
					</TouchableOpacity>

					<View style={styles.loginContainer}>
						<Text style={styles.loginText}>Already have an account?</Text>
						<Link href="/login" asChild>
							<TouchableOpacity disabled={loading}>
								<Text style={styles.loginLink}>Sign in</Text>
							</TouchableOpacity>
						</Link>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
