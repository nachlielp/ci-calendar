// Inline SVG icons (Material Symbols, as in legacy/src/assets/svgs), sized by
// CSS and coloured by `currentColor`. One module per icon, so an icon only
// used by a lazy page ships in that page's chunk, never in the initial JS.
// Add a new icon as its own file the same way; don't load SVG files at
// runtime.

/** The icon component for one Material Symbols path. */
export function icon(path: string) {
    return function Icon({ className }: { className?: string }) {
        return (
            <svg
                aria-hidden="true"
                className={className}
                viewBox="0 -960 960 960"
                fill="currentColor"
            >
                <path d={path} />
            </svg>
        )
    }
}
