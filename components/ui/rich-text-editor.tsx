'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, List, ListOrdered, Undo, Redo, Link as LinkIcon, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  /** Compact mode: only bold+italic, smaller height (for Bemerkungen) */
  compact?: boolean
}

export function RichTextEditor({ content, onChange, placeholder, compact = false }: RichTextEditorProps) {
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
              onClick={() => {
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run()
                } else {
                  const url = window.prompt('URL eingeben:')
                  if (url) {
                    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                  }
                }
              }}
              active={editor.isActive('link')}
              title="Link einfügen"
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
