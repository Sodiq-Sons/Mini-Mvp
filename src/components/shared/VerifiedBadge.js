import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 14 }) {
    return (
        <span
            title="Verified Corps Member"
            className="inline-flex items-center justify-center rounded-full"
            style={{ color: "#F59E0B" }}
        >
            <BadgeCheck
                size={size}
                fill="#F59E0B"
                strokeWidth={1.5}
                color="white"
            />
        </span>
    );
}
