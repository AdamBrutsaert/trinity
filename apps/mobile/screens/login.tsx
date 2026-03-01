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
import { styles } from "@/styles/screens/login.styles";

export default function LoginScreen() {
	const router = useRouter();
	const { login } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert("Error", "Please fill in all fields.");
			return;
		}

		if (!email.includes("@")) {
			Alert.alert("Error", "Please enter a valid email address.");
			return;
		}

		setLoading(true);
		try {
			const result = await login(email, password);
			if (!result.success) {
				Alert.alert("Sign-in failed", result.error || "Something went wrong.");
				return;
			}
			router.replace("/");
		} catch (error) {
			Alert.alert("Error", "An unexpected error occurred.");
			console.error("Login error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView behavior="padding" style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.header}>
					<Text style={styles.title}>Trinity</Text>
					<Text style={styles.subtitle}>Welcome</Text>
				</View>

				<View style={styles.formContainer}>
					<View style={styles.inputContainer}>
						<Text style={styles.label}>Email</Text>
						<TextInput
							style={styles.input}
							placeholder="you@email.com"
							placeholderTextColor="#999"
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							keyboardType="email-address"
							editable={!loading}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Password</Text>
						<TextInput
							style={styles.input}
							placeholder="••••••••"
							placeholderTextColor="#999"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							autoCapitalize="none"
							editable={!loading}
						/>
					</View>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleLogin}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Sign in</Text>
						)}
					</TouchableOpacity>

					<View style={styles.registerContainer}>
						<Text style={styles.registerText}>{"Don't have an account?"}</Text>
						<Link href="/register" asChild>
							<TouchableOpacity disabled={loading}>
								<Text style={styles.registerLink}>Sign up</Text>
							</TouchableOpacity>
						</Link>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
