import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface BasicTiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const BasicTiptapEditor: React.FC<BasicTiptapEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your message...",
  className = "",
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Enable all list features
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        listItem: {
          HTMLAttributes: {
            class: 'list-item',
          },
        },
        // Enable hard breaks for line breaks
        hardBreak: true,
        // Enable paragraph breaks
        paragraph: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3',
        style: `
          .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin: 0.5rem 0;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin: 0.5rem 0;
          }
          .ProseMirror li {
            margin: 0.25rem 0;
            display: list-item;
            list-style-position: outside;
          }
          .ProseMirror br {
            line-height: 1;
          }
          .ProseMirror ul ul {
            list-style-type: circle;
          }
          .ProseMirror ul ul ul {
            list-style-type: square;
          }
          /* Fix list item paragraphs */
          .ProseMirror li p {
            margin: 0;
            display: inline;
          }
          /* Override any conflicting prose styles */
          .prose ul, .prose ol {
            list-style-position: outside !important;
            padding-left: 1.5rem !important;
          }
          .prose li {
            display: list-item !important;
            list-style-position: outside !important;
          }
          .prose li p {
            margin: 0 !important;
            display: inline !important;
          }
        `,
      },
      handleKeyDown: (view, event) => {
        // Handle Shift+Enter for line breaks
        if (event.key === 'Enter' && event.shiftKey) {
          editor?.chain().focus().setHardBreak().run();
          return true;
        }
        
        // Handle Tab for list indentation (let StarterKit handle this)
        if (event.key === 'Tab') {
          // Let StarterKit handle tab behavior for lists
          return false;
        }
        
        return false;
      },
    },
  });

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        {/* Bold */}
        <button
          type="button"
          onClick={() => {
            console.log('Bold clicked');
            editor.chain().focus().toggleBold().run();
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-200' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => {
            console.log('Italic clicked');
            editor.chain().focus().toggleItalic().run();
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-200' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4L6 20M14 4l-4 16" />
          </svg>
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => {
            console.log('Strike clicked');
            editor.chain().focus().toggleStrike().run();
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('strike') ? 'bg-gray-200' : ''
          }`}
          title="Strikethrough"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l6 0" />
          </svg>
        </button>

        {/* Code */}
        <button
          type="button"
          onClick={() => {
            console.log('Code clicked');
            editor.chain().focus().toggleCode().run();
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('code') ? 'bg-gray-200' : ''
          }`}
          title="Code"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => {
            console.log('Bullet list clicked');
            console.log('Can toggle bullet list:', editor.can().chain().focus().toggleBulletList().run());
            console.log('Is active bullet list:', editor.isActive('bulletList'));
            console.log('Current selection:', editor.state.selection);
            console.log('Current content before:', editor.getHTML());
            
            const result = editor.chain().focus().toggleBulletList().run();
            console.log('Toggle result:', result);
            console.log('Editor HTML after toggle:', editor.getHTML());
            console.log('Is active bullet list after:', editor.isActive('bulletList'));
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-200' : ''
          }`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => {
            console.log('Ordered list clicked');
            editor.chain().focus().toggleOrderedList().run();
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-200' : ''
          }`}
          title="Ordered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => {
            console.log('Blockquote clicked');
            editor.chain().focus().toggleBlockquote().run();
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('blockquote') ? 'bg-gray-200' : ''
          }`}
          title="Quote"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>

        {/* Code Block */}
        <button
          type="button"
          onClick={() => {
            console.log('Code block clicked');
            editor.chain().focus().toggleCodeBlock().run();
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('codeBlock') ? 'bg-gray-200' : ''
          }`}
          title="Code Block"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Link */}
        <button
          type="button"
          onClick={() => {
            console.log('Link clicked');
            setLink();
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('link') ? 'bg-gray-200' : ''
          }`}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Line Break */}
        <button
          type="button"
          onClick={() => {
            console.log('Line break clicked');
            editor.chain().focus().setHardBreak().run();
          }}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Line Break (Shift+Enter)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </button>

        {/* Horizontal Rule */}
        <button
          type="button"
          onClick={() => {
            console.log('Horizontal rule clicked');
            editor.chain().focus().setHorizontalRule().run();
          }}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Horizontal Rule"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default BasicTiptapEditor;
