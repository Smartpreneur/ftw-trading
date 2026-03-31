'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, List, ListOrdered, Undo, Redo, Link as LinkIcon, Unlink, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect, useCallback } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  /** Compact mode: only bold+italic, smaller height (for Bemerkungen) */
  compact?: boolean
}

export function RichTextEditor({ content, onChange, placeholder, compact = false }: RichTextEditorProps) {
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const urlInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure(compact ? {
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      } : {}),
      ...(!compact ? [Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      })] : []),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none px-3 py-2 focus:outline-none',
          compact ? 'min-h-[60px]' : 'min-h-[250px]'
        ),
      },
    },
  })

  const openLinkForm = useCallback(() => {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    // Pre-fill with selected text
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '')
    setLinkText(selectedText)
    setLinkUrl('')
    setShowLinkForm(true)
  }, [editor])

  useEffect(() => {
    if (showLinkForm && urlInputRef.current) {
      urlInputRef.current.focus()
    }
  }, [showLinkForm])

  function handleLinkSubmit() {
    if (!editor || !linkUrl.trim()) return
    const url = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`

    if (linkText.trim()) {
      // If link text differs from selection or nothing was selected, insert new text with link
      const { from, to } = editor.state.selection
      const currentText = editor.state.doc.textBetween(from, to, '')
      if (currentText !== linkText.trim()) {
        editor.chain().focus()
          .deleteSelection()
          .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`)
          .run()
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    setShowLinkForm(false)
    setLinkUrl('')
    setLinkText('')
  }

  if (!editor) return null

  return (
    <div className="rounded-md border border-input overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b bg-muted/30 px-2 py-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Fett (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Kursiv (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        {!compact && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Aufzählung"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Nummerierung"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarButton
              onClick={openLinkForm}
              active={editor.isActive('link')}
              title={editor.isActive('link') ? 'Link entfernen' : 'Link einfügen'}
            >
              {editor.isActive('link') ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
            </ToolbarButton>
          </>
        )}
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Rückgängig (Ctrl+Z)"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Wiederholen (Ctrl+Y)"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Link Form */}
      {showLinkForm && (
        <div className="border-b bg-muted/20 px-3 py-2.5 flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Link-Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="z.B. Hier klicken"
                  className="w-full mt-0.5 px-2 py-1 text-sm rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">URL</label>
                <input
                  ref={urlInputRef}
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLinkSubmit() } }}
                  placeholder="https://..."
                  className="w-full mt-0.5 px-2 py-1 text-sm rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLinkSubmit}
            disabled={!linkUrl.trim()}
            className="px-3 py-1 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
          >
            Einfügen
          </button>
          <button
            type="button"
            onClick={() => { setShowLinkForm(false); editor.chain().focus().run() }}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded p-1.5 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        disabled && 'opacity-30 pointer-events-none'
      )}
    >
      {children}
    </button>
  )
}
