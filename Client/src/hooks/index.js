/**
 * Hooks Index
 * Central export for all custom hooks
 */

/**
 * Hooks Index - Central export for all custom hooks
 * Provides clean import paths for application hooks
 */

// Legacy hooks (for backward compatibility during migration)
export { useAuth } from "./useAuth";
export { useSettings } from "./useSettings";

// Redux-based hooks (new implementation)
export { useAuth as useAuthRedux } from "./useAuthRedux";
export { useSettings as useSettingsRedux } from "./useSettingsRedux";

// Form and utility hooks
export { useForm } from "./useForm";
export { useAsync } from "./useAsync";
export { usePasswordToggle } from "./usePasswordToggle";

// UI hooks
export { useToast } from "./use-toast";
export { useMobile } from "./use-mobile";

// Plan gating hooks
export { usePlanGate, useRouteAccess, isProRoute } from "./usePlanGate";

// Intake tracking hook
export { default as useIntakeTracking } from "./useIntakeTracking";

// Theme hook
export { useTheme, ThemeProvider } from "./useTheme.jsx";

// Notifications hook
export { useNotifications } from "./useNotifications";
// Chatbot hook
export { useChatbot } from "./useChatbot";
