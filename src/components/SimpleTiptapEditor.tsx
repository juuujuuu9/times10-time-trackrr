import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';

interface SimpleTiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const SimpleTiptapEditor: React.FC<SimpleTiptapEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your message...",
  className = "",
}) => {
  // Inject styles into document head
  useEffect(() => {
    const styleId = 'tiptap-editor-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .ProseMirror li {
          margin: 0.25rem 0 !important;
          display: list-item !important;
        }
        .ProseMirror ul li::marker {
          content: "•" !important;
          color: #374151 !important;
        }
        .ProseMirror ol li::marker {
          content: counter(list-item) "." !important;
          color: #374151 !important;
        }
        .ProseMirror pre {
          background: #f8f9fa !important;
          border: 1px solid #e9ecef !important;
          border-radius: 0.375rem !important;
          padding: 1rem !important;
          margin: 1rem 0 !important;
          overflow-x: auto !important;
        }
        .ProseMirror code {
          background: #f1f3f4 !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.875em !important;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb !important;
          padding-left: 1rem !important;
          margin: 1rem 0 !important;
          font-style: italic !important;
          color: #6b7280 !important;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        strike: false, // Disable the built-in strike to use our custom one
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 hover:text-blue-800 underline',
          },
        },
      }),
      Strike,
      CodeBlockLowlight.configure({
        lowlight: createLowlight(),
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3 tiptap-editor',
      },
    },
  });

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  // Debug: Log editor state
  console.log('Editor active states:', {
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    strike: editor.isActive('strike'),
    code: editor.isActive('code'),
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    blockquote: editor.isActive('blockquote'),
    codeBlock: editor.isActive('codeBlock'),
    link: editor.isActive('link'),
  });

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        {/* Bold */}
        <button
          type="button"
          onClick={() => {
            console.log('Bold clicked, can toggle:', editor.can().chain().focus().toggleBold().run());
            editor.chain().focus().toggleBold().run();
          }}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-200' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M2 1H8.625C11.0412 1 13 2.95875 13 5.375C13 6.08661 12.8301 6.75853 12.5287 7.35243C13.4313 8.15386 14 9.32301 14 10.625C14 13.0412 12.0412 15 9.625 15H2V1ZM5.5 9.75V11.5H9.625C10.1082 11.5 10.5 11.1082 10.5 10.625C10.5 10.1418 10.1082 9.75 9.625 9.75H5.5ZM5.5 6.25H8.625C9.10825 6.25 9.5 5.85825 9.5 5.375C9.5 4.89175 9.10825 4.5 8.625 4.5H5.5V6.25Z" fill="currentColor" />
          </svg>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => {
            console.log('Italic clicked, can toggle:', editor.can().chain().focus().toggleItalic().run());
            editor.chain().focus().toggleItalic().run();
          }}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-200' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 1H5V4H7.75219L5.08553 12H2V15H11V12H8.24781L10.9145 4H14V1Z" fill="currentColor" />
          </svg>
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('strike') ? 'bg-gray-200' : ''
          }`}
          title="Strikethrough"
        >
          <svg className="w-4 h-4" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="302.748,220.383 302.748,126.887 407.374,126.887 407.374,55.652 104.626,55.652 104.626,126.887 209.252,126.887 209.252,220.383 0,220.383 0,293.844 209.252,293.844 209.252,456.348 302.748,456.348 302.748,293.844 512,293.844 512,220.383" fill="currentColor" />
          </svg>
        </button>

        {/* Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
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
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor?.can().chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor?.isActive('bulletList') ? 'bg-gray-200' : ''
          }`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 1H1V3H3V1Z" fill="currentColor" />
            <path d="M3 5H1V7H3V5Z" fill="currentColor" />
            <path d="M1 9H3V11H1V9Z" fill="currentColor" />
            <path d="M3 13H1V15H3V13Z" fill="currentColor" />
            <path d="M15 1H5V3H15V1Z" fill="currentColor" />
            <path d="M15 5H5V7H15V5Z" fill="currentColor" />
            <path d="M5 9H15V11H5V9Z" fill="currentColor" />
            <path d="M15 13H5V15H15V13Z" fill="currentColor" />
          </svg>
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
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
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={!editor.can().chain().focus().toggleBlockquote().run()}
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
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
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
          onClick={setLink}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('link') ? 'bg-gray-200' : ''
          }`}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Horizontal Rule */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
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

export default SimpleTiptapEditor;
