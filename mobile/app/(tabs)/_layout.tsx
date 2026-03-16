import React, { useMemo } from "react";
import { Tabs } from "expo-router";
import { Home, Compass, Library as LibraryIcon, User } from "lucide-react-native";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../src/theme/ThemeContext";

type TabIconProps = {
  IconComponent: any;
  color: string;
  focused: boolean;
  label: string;
  styles: any;
};

const TabBarIcon = ({ IconComponent, color, focused, label, styles }: TabIconProps) => (
  <View style={styles.tabItem}>
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <IconComponent size={20} strokeWidth={focused ? 2.5 : 2} color={color} />
    </View>
    <Text style={[styles.label, { color, fontWeight: focused ? "700" : "500" }]}>
      {label}
    </Text>
  </View>
);

export default function TabsLayout() {
  const { colors, theme } = useTheme();

  const tabBarBg = theme === 'dark' ? "#18181C" : "#FFFFFF";
  const inactiveTint = theme === 'dark' ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  const styles = useMemo(() => StyleSheet.create({
    tabBar: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: Platform.OS === "ios" ? 12 : 1,
      height: Platform.OS === "ios" ? 82 : 68,
      paddingTop: 8,
      paddingBottom: Platform.OS === "ios" ? 18 : 8,
      borderTopWidth: 0,
      borderRadius: 8,
      backgroundColor: tabBarBg,
      elevation: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
    },
    tabItem: { alignItems: "center", justifyContent: "center", minWidth: 70, gap: 2 },
    iconWrap: { alignItems: "center", justifyContent: "center", width: 38, height: 30, borderRadius: 12 },
    iconWrapActive: { backgroundColor: colors.primary + "18" },
    label: { fontSize: 11, lineHeight: 14, letterSpacing: 0.2, textAlign: "center", marginTop: 1 },
  }), [colors, theme]);

  const makeIcon = (IconComponent: any, label: string) =>
    ({ color, focused }: { color: string; focused: boolean }) => (
      <TabBarIcon IconComponent={IconComponent} color={color} focused={focused} label={label} styles={styles} />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: inactiveTint,
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        sceneContainerStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: makeIcon(Home, "Home") }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: makeIcon(Compass, "Explore") }} />
      <Tabs.Screen name="library" options={{ title: "Library", tabBarIcon: makeIcon(LibraryIcon, "Library") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: makeIcon(User, "Profile") }} />
    </Tabs>
  );
}
