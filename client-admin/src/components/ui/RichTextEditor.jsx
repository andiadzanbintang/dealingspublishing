// src/components/ui/RichTextEditor.jsx
import { useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Node, mergeAttributes } from '@tiptap/core'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Unlink,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadAPI } from '@/services/api'

// ─── Resizable Image Node View ────────────────────────────────────────────────
function ResizableImageView({ node, updateAttributes, selected }) {
  const { src, alt, title, width } = node.attrs
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const imgRef = useRef(null)

  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault()
      isResizing.current = true
      startX.current = e.clientX
      startWidth.current = imgRef.current?.offsetWidth || 300

      const onMouseMove = (moveEvent) => {
        if (!isResizing.current) return
        const delta = moveEvent.clientX - startX.current
        const newWidth = Math.max(80, startWidth.current + delta)
        updateAttributes({ width: `${Math.round(newWidth)}px` })
      }

      const onMouseUp = () => {
        isResizing.current = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [updateAttributes]
  )

  return (
    <NodeViewWrapper
      className="relative inline-block group my-2"
      style={{ width: width || 'auto', maxWidth: '100%' }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt || ''}
        title={title || ''}
        style={{ width: '100%', display: 'block', borderRadius: '6px' }}
        className={cn(
          'select-none',
          selected ? 'ring-2 ring-primary-500 ring-offset-1' : ''
        )}
        draggable={false}
      />

      {/* Right resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-10 bg-primary-500 rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
        title="Drag to resize"
      />

      {/* Left resize handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault()
          isResizing.current = true
          startX.current = e.clientX
          startWidth.current = imgRef.current?.offsetWidth || 300

          const onMouseMove = (moveEvent) => {
            if (!isResizing.current) return
            const delta = startX.current - moveEvent.clientX
            const newWidth = Math.max(80, startWidth.current + delta)
            updateAttributes({ width: `${Math.round(newWidth)}px` })
          }

          const onMouseUp = () => {
            isResizing.current = false
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
          }

          window.addEventListener('mousemove', onMouseMove)
          window.addEventListener('mouseup', onMouseUp)
        }}
        className="absolute top-1/2 -left-2 -translate-y-1/2 w-3 h-10 bg-primary-500 rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
        title="Drag to resize"
      />
    </NodeViewWrapper>
  )
}

// ─── Custom Resizable Image Tiptap Extension ──────────────────────────────────
const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'img[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})

// ─── Toolbar helpers (unchanged) ──────────────────────────────────────────────
function ToolbarButton({ onClick, isActive, children, title, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-neutral-200 mx-1" />
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
}) {
  const isDraggingOver = useRef(false)
  const editorWrapperRef = useRef(null)

  // ── Upload helper (reused by both drag-drop and toolbar button) ──
  const uploadImageFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return null

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await uploadAPI.uploadImage(formData, 'researchhub/news')
      return response?.data?.url || null
    } catch (err) {
      console.error('Image upload failed:', err)
      return null
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      // ResizableImage replaces the old ImageExtension
      ResizableImage,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-neutral max-w-none min-h-[220px] px-4 py-3 focus:outline-none text-sm leading-relaxed',
      },
      // ── Native drop handler on the ProseMirror view ──
      handleDrop(view, event, _slice, moved) {
        if (moved) return false // let ProseMirror handle node moves

        const files = Array.from(event.dataTransfer?.files || []).filter((f) =>
          f.type.startsWith('image/')
        )
        if (!files.length) return false

        event.preventDefault()

        const { schema } = view.state
        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })

        files.forEach(async (file) => {
          const url = await uploadImageFile(file)
          if (!url) return

          const node = schema.nodes.resizableImage.create({ src: url })
          const transaction = view.state.tr.insert(coordinates?.pos ?? 0, node)
          view.dispatch(transaction)
        })

        return true
      },

      // ── Paste handler for images copied from clipboard ──
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItems = items.filter((i) => i.type.startsWith('image/'))
        if (!imageItems.length) return false

        event.preventDefault()

        imageItems.forEach(async (item) => {
          const file = item.getAsFile()
          if (!file) return

          const url = await uploadImageFile(file)
          if (!url) return

          const { schema, tr, selection } = view.state
          const node = schema.nodes.resizableImage.create({ src: url })
          view.dispatch(tr.insert(selection.anchor, node))
        })

        return true
      },
    },
  })

  // ── Sync editor when content is loaded from backend after initial render ──
  useEffect(() => {
    if (!editor) return

    const currentHTML = editor.getHTML()
    const nextHTML = content || ''

    if (nextHTML && nextHTML !== currentHTML) {
      editor.commands.setContent(nextHTML, false)
    }

    if (!nextHTML && currentHTML !== '<p></p>') {
      editor.commands.clearContent(false)
    }
  }, [content, editor])

  // ── Drag-over highlight on the wrapper div ──
  useEffect(() => {
    const el = editorWrapperRef.current
    if (!el) return

    const onDragOver = (e) => {
      const hasImage = Array.from(e.dataTransfer?.items || []).some((i) =>
        i.type.startsWith('image/')
      )
      if (!hasImage) return
      e.preventDefault()
      if (!isDraggingOver.current) {
        isDraggingOver.current = true
        el.classList.add('ring-2', 'ring-primary-400', 'ring-inset')
      }
    }

    const onDragLeave = () => {
      isDraggingOver.current = false
      el.classList.remove('ring-2', 'ring-primary-400', 'ring-inset')
    }

    const onDrop = () => {
      isDraggingOver.current = false
      el.classList.remove('ring-2', 'ring-primary-400', 'ring-inset')
    }

    el.addEventListener('dragover', onDragOver)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('dragleave', onDragLeave)
      el.removeEventListener('drop', onDrop)
    }
  }, [])

  if (!editor) return null

  // ── Original handlers (unchanged) ──
  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl || 'https://')

    if (url === null) return

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url.trim() })
      .run()
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:', 'https://')

    if (url && url.trim()) {
      editor.chain().focus().setImage({ src: url.trim() }).run()
    }
  }

  // ── New: upload from local file via toolbar button ──
  const addImageFromFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async () => {
      const files = Array.from(input.files || [])
      for (const file of files) {
        const url = await uploadImageFile(file)
        if (url) {
          editor
            .chain()
            .focus()
            .insertContent({ type: 'resizableImage', attrs: { src: url } })
            .run()
        }
      }
    }
    input.click()
  }

  return (
    <div
      ref={editorWrapperRef}
      className="tiptap-editor border border-neutral-200 rounded-xl overflow-hidden bg-white transition-shadow"
    >
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b border-neutral-200 bg-neutral-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Add/Edit Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={removeLink}
          disabled={!editor.isActive('link')}
          title="Remove Link"
        >
          <Unlink className="w-4 h-4" />
        </ToolbarButton>

        {/* Original: insert image by URL */}
        <ToolbarButton onClick={addImage} title="Add Image by URL">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        {/* New: upload image from local file */}
        <ToolbarButton onClick={addImageFromFile} title="Upload Image from File">
          <Upload className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
