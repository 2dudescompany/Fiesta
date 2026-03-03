import type { ReactNode } from "react";
import { useTimeTheme } from "../../hooks/useTimeTheme";

interface ThemedCardProps {
    children: ReactNode;
    className?: string;
    /** Apply accent highlight (blue tint) */
    accent?: boolean;
    /** Make card fully opaque (no glass) — for chart containers */
    solid?: boolean;
}

/**
 * A card that automatically adapts to the current time theme.
 *
 * Light mode → white card, subtle border + shadow
 * Dark mode  → glassmorphism: translucent bg, backdrop-blur, glowing border
 */
export function ThemedCard({ children, className = "", accent = false, solid = false }: ThemedCardProps) {
    const theme = useTimeTheme();

    const base = "rounded-xl transition-all duration-300 ";

    const light = solid
        ? "bg-white border border-gray-200 shadow-sm "
        : accent
            ? "bg-blue-50 border border-blue-200 shadow-sm "
            : "bg-white border border-gray-200 shadow-sm ";

    const dark = solid
        ? "bg-gray-900/80 border border-white/10 shadow-lg "
        : accent
            ? "bg-blue-900/30 border border-blue-400/30 shadow-lg backdrop-blur-md "
            : "bg-white/8 border border-white/15 shadow-lg backdrop-blur-md ";

    return (
        <div className={`${base} ${theme === "dark" ? dark : light} ${className}`}>
            {children}
        </div>
    );
}

interface ThemedStatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    accent?: boolean;
    unavailable?: boolean;
    icon?: ReactNode;
}

/**
 * A compact stat card with theme-aware styling.
 * Shows a soft "unavailable" state when data is blocked by browser/ad-blocker.
 */
export function ThemedStatCard({
    label, value, sub, accent = false, unavailable = false, icon
}: ThemedStatCardProps) {
    const theme = useTimeTheme();
    const isDark = theme === "dark";

    return (
        <ThemedCard accent={accent} className="p-4">
            <div className="flex items-start justify-between">
                <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-white/50" : "text-gray-500"}`}>
                    {label}
                </p>
                {icon && <span className={`${isDark ? "text-white/40" : "text-gray-400"}`}>{icon}</span>}
            </div>

            {unavailable ? (
                <>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? "text-white/20" : "text-gray-300"}`}>—</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-orange-400/70" : "text-orange-400"}`}>
                        Limited by browser / ad-blocker
                    </p>
                </>
            ) : (
                <>
                    <p className={`text-2xl font-bold mt-1 ${accent
                            ? isDark ? "text-blue-300" : "text-blue-600"
                            : isDark ? "text-white" : "text-gray-900"
                        }`}>{value}</p>
                    {sub && (
                        <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-gray-400"}`}>{sub}</p>
                    )}
                </>
            )}
        </ThemedCard>
    );
}
