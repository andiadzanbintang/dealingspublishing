// src/components/ui/ExpandableText.jsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Collapses a long block of text and offers a "Read more" toggle.
 *
 * The toggle only appears when the content genuinely overflows — an editor who
 * writes two sentences should never see a pointless button, and one who pastes
 * six paragraphs should. That is measured from the rendered element rather than
 * guessed from a character count, because the same string wraps differently on a
 * phone and on a desktop.
 *
 * Two clamp modes:
 *   lines={4}            for plain prose — clamps to a whole number of lines
 *   collapsedHeight={320} for rich HTML from the editor, where headings, lists
 *                         and images make a line count meaningless
 *
 * `fadeFrom` must match the surrounding background, otherwise the gradient that
 * softens the cut edge draws a visible band.
 */
export default function ExpandableText({
  children,
  html,
  lines,
  collapsedHeight = 320,
  className,
  contentClassName,
  moreLabel = 'Read more',
  lessLabel = 'Show less',
  fadeFrom = 'from-white',
  align = 'left',
}) {
  const containerRef = useRef(null)
  const contentRef = useRef(null)

  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  const measure = useCallback(() => {
    const content = contentRef.current
    if (!content) return

    let limit = collapsedHeight

    if (lines) {
      const styles = window.getComputedStyle(content)
      const lineHeight = parseFloat(styles.lineHeight)
      const fontSize = parseFloat(styles.fontSize) || 16
      // `line-height: normal` computes to the string, not a number
      limit = (Number.isFinite(lineHeight) ? lineHeight : fontSize * 1.6) * lines
    }

    // scrollHeight reports the full content height even while the element is
    // clamped, so this stays accurate without having to un-clamp and re-measure.
    setOverflows(content.scrollHeight > limit + 4)
  }, [collapsedHeight, lines])

  useLayoutEffect(() => {
    measure()
  }, [measure, html, children])

  useEffect(() => {
    const content = contentRef.current
    if (!content || typeof ResizeObserver === 'undefined') return

    // Catches both a viewport resize and late-arriving content such as images
    // or a web font finishing loading.
    const observer = new ResizeObserver(measure)
    observer.observe(content)

    return () => observer.disconnect()
  }, [measure])

  const collapse = () => {
    setExpanded(false)

    // Collapsing a tall block can leave the reader stranded below the fold with
    // no context. Bring the top of the block back into view when that happens.
    requestAnimationFrame(() => {
      const container = containerRef.current
      if (!container) return

      const { top } = container.getBoundingClientRect()
      if (top < 80) {
        window.scrollTo({ top: window.scrollY + top - 120, behavior: 'smooth' })
      }
    })
  }

  const clampStyle =
    !expanded && overflows
      ? lines
        ? {
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: lines,
            overflow: 'hidden',
          }
        : { maxHeight: collapsedHeight, overflow: 'hidden' }
      : undefined

  const showToggle = overflows

  return (
    <div ref={containerRef} className={className}>
      <div className="relative">
        <div
          ref={contentRef}
          style={clampStyle}
          className={cn('transition-[max-height] duration-300 ease-out', contentClassName)}
        >
          {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
        </div>

        {/* Softens the cut so it reads as "there is more", not as a mistake */}
        {!expanded && showToggle && (
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent',
              fadeFrom
            )}
          />
        )}
      </div>

      {showToggle && (
        <div className={cn('mt-3 flex', align === 'center' ? 'justify-center' : 'justify-start')}>
          <button
            type="button"
            onClick={() => (expanded ? collapse() : setExpanded(true))}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {expanded ? lessLabel : moreLabel}
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                expanded && 'rotate-180'
              )}
            />
          </button>
        </div>
      )}
    </div>
  )
}
