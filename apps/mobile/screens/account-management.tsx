import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	Image,
	type LayoutChangeEvent,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppleToast } from "@/components/apple-toast";
import {
	getProfileAvatarSource,
	ProfileAvatarPicker,
} from "@/components/profile-avatar-picker";
import { ProfileSaveBar } from "@/components/profile-save-bar";
import { ProfileTextField } from "@/components/profile-text-field";
import { useAuth } from "@/features/auth/AuthContext";
import { styles } from "@/styles/screens/account-management.styles";

function computeInitials(
	firstName: string,
	lastName: string,
	email: string,
): string {
	const a = firstName.trim();
	const b = lastName.trim();
	if (a || b) return `${a[0] ?? ""}${b[0] ?? ""}`.toUpperCase();
	const e = email.trim();
	if (e && e.includes("@")) return e[0].toUpperCase();
	return "U";
}

export default function AccountManagementScreen() {
	const insets = useSafeAreaInsets();
	const { user, updateProfile } = useAuth();

	const [baseline, setBaseline] = useState<{
		avatarId: number | null;
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
	} | null>(null);
	const [saveBarHeight, setSaveBarHeight] = useState(86);

	const [avatarId, setAvatarId] = useState<number | null>(null);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");

	const [saving, setSaving] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState("");

	useEffect(() => {
		const nextAvatar =
			typeof user?.avatarId === "number" ? user.avatarId : null;
		const nextFirst = typeof user?.firstName === "string" ? user.firstName : "";
		const nextLast = typeof user?.lastName === "string" ? user.lastName : "";
		const nextEmail = typeof user?.email === "string" ? user.email : "";
		const nextPhone =
			typeof user?.phoneNumber === "string" ? user.phoneNumber : "";

		setAvatarId(nextAvatar);
		setFirstName(nextFirst);
		setLastName(nextLast);
		setEmail(nextEmail);
		setPhoneNumber(nextPhone);

		setBaseline({
			avatarId: nextAvatar,
			firstName: nextFirst,
			lastName: nextLast,
			email: nextEmail,
			phone: nextPhone,
		});
	}, [user]);

	const isDirty = useMemo(() => {
		if (!baseline) return false;

		const now = {
			avatarId,
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			email: email.trim(),
			phone: phoneNumber.trim(),
		};
		const base = {
			avatarId: baseline.avatarId,
			firstName: baseline.firstName.trim(),
			lastName: baseline.lastName.trim(),
			email: baseline.email.trim(),
			phone: baseline.phone.trim(),
		};

		return (
			now.avatarId !== base.avatarId ||
			now.firstName !== base.firstName ||
			now.lastName !== base.lastName ||
			now.phone !== base.phone
		);
	}, [avatarId, baseline, email, firstName, lastName, phoneNumber]);

	const avatarSource = useMemo(
		() => getProfileAvatarSource(avatarId),
		[avatarId],
	);

	const displayName = useMemo(() => {
		const full = `${firstName.trim()} ${lastName.trim()}`.trim();
		return full || "Your profile";
	}, [firstName, lastName]);

	const initials = useMemo(
		() => computeInitials(firstName, lastName, email),
		[email, firstName, lastName],
	);

	const showToast = useCallback((message: string) => {
		setToastMessage(message);
		setToastVisible(true);
	}, []);

	const onSave = useCallback(async () => {
		if (!isDirty) return;

		setSaving(true);
		try {
			await updateProfile({
				avatarId: avatarId ?? undefined,
				firstName: firstName.trim() || undefined,
				lastName: lastName.trim() || undefined,
				phoneNumber: phoneNumber.trim() || undefined,
			});

			setBaseline({
				avatarId,
				firstName,
				lastName,
				email,
				phone: phoneNumber,
			});
			showToast("Profile updated");
		} catch (e) {
			console.error("Update profile error:", e);
			showToast("Unable to save changes");
		} finally {
			setSaving(false);
		}
	}, [
		avatarId,
		email,
		firstName,
		lastName,
		phoneNumber,
		isDirty,
		showToast,
		updateProfile,
	]);

	const onSaveBarLayout = useCallback((e: LayoutChangeEvent) => {
		const next = Math.ceil(e.nativeEvent.layout.height);
		if (!Number.isFinite(next) || next <= 0) return;
		setSaveBarHeight(next);
	}, []);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.screen}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						accessibilityRole="button"
						style={styles.backPill}
						activeOpacity={0.85}
					>
						<Text style={styles.backPillText}>Back</Text>
					</TouchableOpacity>

					<Text style={styles.title}>Account</Text>

					<View style={styles.spacer} />
				</View>

				<ScrollView
					style={styles.scroll}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: saveBarHeight + Math.max(24, insets.bottom + 18) },
					]}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.card}>
						<Text style={styles.cardTitle}>PROFILE</Text>
						<View style={styles.profileRow}>
							<View style={styles.avatarBig}>
								{avatarSource ? (
									<Image source={avatarSource} style={styles.avatarBigImage} />
								) : (
									<Text style={styles.avatarInitials}>{initials}</Text>
								)}
							</View>

							<View style={styles.profileMain}>
								<Text style={styles.name}>{displayName}</Text>
								<Text style={styles.email}>
									{email.trim() || "No email set yet"}
								</Text>
								<Text style={styles.muted}>
									Changes are saved locally for now.{" "}
									<Text style={styles.mutedEmphasis}>Server sync</Text> will
									come next.
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.card}>
						<Text style={styles.cardTitle}>DETAILS</Text>
						<View style={styles.fields}>
							<ProfileTextField
								label="First name"
								value={firstName}
								onChangeText={setFirstName}
								placeholder="Your first name"
								autoCapitalize="words"
							/>
							<ProfileTextField
								label="Last name"
								value={lastName}
								onChangeText={setLastName}
								placeholder="Your last name"
								autoCapitalize="words"
							/>
							<ProfileTextField
								label="Email"
								value={email}
								onChangeText={() => {}}
								placeholder="you@email.com"
								autoCapitalize="none"
								keyboardType="email-address"
								disabled
							/>
							<ProfileTextField
								label="Phone"
								value={phoneNumber}
								onChangeText={setPhoneNumber}
								placeholder="Optional"
								autoCapitalize="none"
								keyboardType="phone-pad"
							/>
						</View>
					</View>

					<View style={styles.card}>
						<ProfileAvatarPicker selectedId={avatarId} onSelect={setAvatarId} />
					</View>

					<View style={styles.footer}>
						<Text style={styles.footerHint}>
							Pick an avatar from the app and update your profile information.
						</Text>
					</View>
				</ScrollView>
			</View>

			<ProfileSaveBar
				enabled={isDirty}
				saving={saving}
				bottomInset={insets.bottom}
				onSave={onSave}
				onLayout={onSaveBarLayout}
			/>

			<AppleToast
				visible={toastVisible}
				title="ACCOUNT"
				message={toastMessage}
				topInset={insets.top}
				onDismiss={() => setToastVisible(false)}
			/>
		</SafeAreaView>
	);
}
