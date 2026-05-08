import Image from "next/image";
import { memo } from "react";

const COLORS = ["#556B2F", "#3E5F44", "#F59E0B", "#8B6914", "#4A7C59"];

const Avatar = memo(function Avatar({
    src,
    name = "",
    size = 40,
    className = "",
}) {
    const initials = name
        ? name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
        : "?";
    const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

    if (src) {
        return (
            <div
                className={`rounded-full overflow-hidden shrink-0 ${className}`}
                style={{ width: size, height: size, minWidth: size }}
            >
                <Image
                    src={src}
                    alt={name}
                    width={size * 2}
                    height={size * 2}
                    className="object-cover w-full h-full"
                    loading="lazy"
                    decoding="async"
                    sizes={`${size * 2}px`}
                />
            </div>
        );
    }

    return (
        <div
            className={`rounded-full flex items-center justify-center shrink-0 text-white font-bold select-none ${className}`}
            style={{
                width: size,
                height: size,
                minWidth: size,
                background: color,
                fontSize: size * 0.36,
            }}
            aria-label={name}
        >
            {initials}
        </div>
    );
});

export default Avatar;
