import React from "react";
import {
	Text,
	TouchableOpacity,
	View,
	type LayoutChangeEvent,
} from "react-native";
import type { SvgProps } from "react-native-svg";

import { ActionButton } from "@/components/action-button";
import CollapseActionsIcon from "@/assets/svg/collapse-actions.svg";
import ShowActionsIcon from "@/assets/svg/show-actions.svg";
import { styles } from "@/styles/components/bottom-dock.styles";

export type BottomDockAction = {
	key: string;
	title: string;
	subtitle: string;
	onPress: () => void;
	Icon?: React.ComponentType<SvgProps>;
	iconColor?: string;
};

export function BottomDock({
	collapsed,
	onToggleCollapsed,
	onLayout,
	bottomOffset,
	paddingBottom,
	actions,
}: {
	collapsed: boolean;
	onToggleCollapsed: () => void;
	onLayout: (e: LayoutChangeEvent) => void;
	bottomOffset: number;
	paddingBottom: number;
	actions: BottomDockAction[];
}) {
	const ToggleIcon = collapsed ? ShowActionsIcon : CollapseActionsIcon;
	const toggleIconColor = collapsed ? "#111" : "#fff";

	return (
		<View
			onLayout={onLayout}
			style={[styles.bottomDock, { paddingBottom, bottom: bottomOffset }]}
		>
			<TouchableOpacity
				onPress={onToggleCollapsed}
				accessibilityRole="button"
				style={[
					styles.dockToggle,
					collapsed ? styles.dockToggleCollapsed : styles.dockToggleExpanded,
				]}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				activeOpacity={0.85}
			>
				<View style={styles.dockToggleContent}>
					<ToggleIcon width={16} height={16} color={toggleIconColor} />
					<Text
						style={[
							styles.dockToggleText,
							collapsed ? styles.dockToggleTextCollapsed : null,
						]}
					>
						{collapsed ? "Show actions" : "Collapse"}
					</Text>
				</View>
			</TouchableOpacity>

			{!collapsed ? (
				<View style={styles.actionsGrid}>
					{actions.map((action) => (
						<ActionButton
							key={action.key}
							title={action.title}
							subtitle={action.subtitle}
							onPress={action.onPress}
							Icon={action.Icon}
							iconColor={action.iconColor}
						/>
					))}
				</View>
			) : null}
		</View>
	);
}
