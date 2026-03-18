import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Home, Compass, Library as LibraryIcon, User } from "lucide-react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeContext";
import { MiniPlayer } from "../../src/components/MiniPlayer";

export default function TabsLayout() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  const tabBarBg = theme === "dark" ? "#18181C" : "#FFFFFF";
  const inactiveTint =
    theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  // Ensure enough space above system nav
  const bottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 12) : 0;

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: inactiveTint,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarStyle: {
          height: 60 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding + 8,
          paddingHorizontal: 8,
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          elevation: 0,
        },
        sceneContainerStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} strokeWidth={focused ? 2.5 : 1.8} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Compass size={22} strokeWidth={focused ? 2.5 : 1.8} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, focused }) => (
            <LibraryIcon size={22} strokeWidth={focused ? 2.5 : 1.8} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <User size={22} strokeWidth={focused ? 2.5 : 1.8} color={color} />
          ),
        }}
      />
    </Tabs>
    <MiniPlayer />
    </View>
  );
}