declare module "react-highlight-words" {
    import { ComponentType } from "react"

    interface HighlighterProps {
        highlightStyle?: React.CSSProperties
        searchWords: string[]
        autoEscape?: boolean
        textToHighlight: string
        sanitize?: (text: string) => string
        caseSensitive?: boolean
        findChunks?: (options: {
            autoEscape: boolean
            caseSensitive: boolean
            sanitize: (text: string) => string
            searchWords: string[]
            textToHighlight: string
        }) => Array<{ start: number; end: number }>
        highlightTag?: string | ComponentType<any>
        activeClassName?: string
        activeIndex?: number
        highlightClassName?: string
        unhighlightClassName?: string
        highlightStyle?: React.CSSProperties
        unhighlightStyle?: React.CSSProperties
        onMouseOverHighlight?: (
            event: React.MouseEvent<HTMLElement>,
            chunk: { start: number; end: number }
        ) => void
        onMouseOutHighlight?: (
            event: React.MouseEvent<HTMLElement>,
            chunk: { start: number; end: number }
        ) => void
    }

    const Highlighter: ComponentType<HighlighterProps>

    export default Highlighter
}
