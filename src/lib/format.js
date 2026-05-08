import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export function formatRelativeTime(timestamp) {
    if (!timestamp) return "recently";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDateTime(timestamp) {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
    if (isYesterday(date)) return `Yesterday at ${format(date, "h:mm a")}`;
    return format(date, "MMM d, yyyy · h:mm a");
}

export function formatNumber(n) {
    if (!n) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
}

export function getAgeGroup(age) {
    if (!age) return "Unknown";
    if (age < 22) return "Under 22";
    if (age < 25) return "22–24";
    if (age < 28) return "25–27";
    return "28+";
}
