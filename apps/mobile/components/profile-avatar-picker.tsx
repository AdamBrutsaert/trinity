import React, { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { styles } from "@/styles/components/profile-avatar-picker.styles";

type AvatarItem = { id: number; source: number };

const AVATARS: AvatarItem[] = [
	{ id: 1, source: require("../assets/profile/1.png") },
	{ id: 2, source: require("../assets/profile/2.png") },
	{ id: 3, source: require("../assets/profile/3.png") },
	{ id: 4, source: require("../assets/profile/4.png") },
	{ id: 5, source: require("../assets/profile/5.png") },
	{ id: 6, source: require("../assets/profile/6.png") },
	{ id: 7, source: require("../assets/profile/7.png") },
	{ id: 8, source: require("../assets/profile/8.png") },
	{ id: 9, source: require("../assets/profile/9.png") },
	{ id: 10, source: require("../assets/profile/10.png") },
	{ id: 11, source: require("../assets/profile/11.png") },
	{ id: 12, source: require("../assets/profile/12.png") },
	{ id: 13, source: require("../assets/profile/13.png") },
	{ id: 14, source: require("../assets/profile/14.png") },
	{ id: 15, source: require("../assets/profile/15.png") },
	{ id: 16, source: require("../assets/profile/16.png") },
	{ id: 17, source: require("../assets/profile/17.png") },
	{ id: 18, source: require("../assets/profile/18.png") },
	{ id: 19, source: require("../assets/profile/19.png") },
	{ id: 20, source: require("../assets/profile/20.png") },
	{ id: 21, source: require("../assets/profile/21.png") },
	{ id: 22, source: require("../assets/profile/22.png") },
	{ id: 23, source: require("../assets/profile/23.png") },
	{ id: 24, source: require("../assets/profile/24.png") },
	{ id: 25, source: require("../assets/profile/25.png") },
	{ id: 26, source: require("../assets/profile/26.png") },
	{ id: 27, source: require("../assets/profile/27.png") },
	{ id: 28, source: require("../assets/profile/28.png") },
	{ id: 29, source: require("../assets/profile/29.png") },
	{ id: 30, source: require("../assets/profile/30.png") },
	{ id: 31, source: require("../assets/profile/31.png") },
	{ id: 32, source: require("../assets/profile/32.png") },
];

export function getProfileAvatarSource(
	avatarId: number | null | undefined,
): number | null {
	if (!avatarId) return null;
	const idx = Math.max(0, Math.min(AVATARS.length - 1, avatarId - 1));
	return AVATARS[idx]?.source ?? null;
}

export function ProfileAvatarPicker({
	selectedId,
	onSelect,
	title = "Choose a profile photo",
}: {
	selectedId: number | null;
	onSelect: (avatarId: number) => void;
	title?: string;
}) {
	const [expanded, setExpanded] = useState(false);

	const items = useMemo(() => AVATARS, []);
	const rowCount = 8;
	const rowItems = useMemo(() => {
		const base = items.slice(0, rowCount);

		// Keep the row stable while expanded to avoid items jumping
		// between the row and the grid (which can look like images appear/disappear).
		if (expanded) return base;

		// When collapsed, keep the selected avatar visible in the row.
		if (!selectedId) return base;
		const already = base.some((x) => x.id === selectedId);
		if (already) return base;

		const selected = items.find((x) => x.id === selectedId);
		if (!selected) return base;
		return [...base.slice(0, Math.max(0, rowCount - 1)), selected];
	}, [expanded, items, selectedId]);

	const remainingItems = useMemo(() => {
		if (!expanded) return [];
		// Always show the full remainder after the first row.
		// This guarantees 32 total avatars (8 + 24) and avoids duplication.
		return items.slice(rowCount);
	}, [expanded, items]);

	return (
		<View style={styles.wrapper}>
			<Text style={styles.title}>{title}</Text>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.row}
			>
				{rowItems.map((item) => {
					const selected = item.id === selectedId;
					return (
						<TouchableOpacity
							key={item.id}
							accessibilityRole="button"
							accessibilityLabel={`Select avatar ${item.id}`}
							activeOpacity={0.85}
							style={[styles.cell, selected ? styles.cellSelected : null]}
							onPress={() => onSelect(item.id)}
						>
							<Image source={item.source} style={styles.avatar} />
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{expanded ? (
				<View style={styles.grid}>
					{remainingItems.map((item) => {
						const selected = item.id === selectedId;
						return (
							<TouchableOpacity
								key={item.id}
								accessibilityRole="button"
								accessibilityLabel={`Select avatar ${item.id}`}
								activeOpacity={0.85}
								style={[styles.cell, selected ? styles.cellSelected : null]}
								onPress={() => {
									onSelect(item.id);
								}}
							>
								<Image source={item.source} style={styles.avatar} />
							</TouchableOpacity>
						);
					})}
				</View>
			) : null}

			<TouchableOpacity
				accessibilityRole="button"
				activeOpacity={0.85}
				style={styles.dropdown}
				onPress={() => setExpanded((v) => !v)}
			>
				<Text style={styles.dropdownText}>
					{expanded ? "Hide avatars" : "More avatars"}
				</Text>
				<Text style={styles.dropdownChevron}>{expanded ? "˄" : "˅"}</Text>
			</TouchableOpacity>
		</View>
	);
}
