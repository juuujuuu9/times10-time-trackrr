import React, { useCallback, useEffect, useState } from 'react';
import { $getRoot, $getSelection } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $isListNode, ListNode as ListNodeType } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isQuoteNode } from '@lexical/rich-text';
import { $createParagraphNode } from '@lexical/rich-text';

interface LexicalEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

// Toolbar component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text style
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const formatStrikethrough = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  };

  const formatBulletList = () => {
    if (isBulletList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  };

  const formatOrderedList = () => {
    if (isOrderedList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
      {/* Bold */}
      <button
        type="button"
        onClick={formatBold}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          isBold ? 'bg-gray-200' : ''
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
        onClick={formatItalic}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          isItalic ? 'bg-gray-200' : ''
        }`}
        title="Italic (Ctrl+I)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4L6 20M14 4l-4 16" />
        </svg>
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={formatUnderline}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          isUnderline ? 'bg-gray-200' : ''
        }`}
        title="Underline (Ctrl+U)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Strikethrough */}
      <button
        type="button"
        onClick={formatStrikethrough}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          isStrikethrough ? 'bg-gray-200' : ''
        }`}
        title="Strikethrough"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l6 0" />
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Bullet List */}
      <button
        type="button"
        onClick={formatBulletList}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          isBulletList ? 'bg-gray-200' : ''
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
        onClick={formatOrderedList}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          isOrderedList ? 'bg-gray-200' : ''
        }`}
        title="Ordered List"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Link */}
      <button
        type="button"
        onClick={insertLink}
        className="p-2 rounded hover:bg-gray-100 transition-colors"
        title="Link"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
    </div>
  );
}

// Missing imports and commands - let me fix this
import { 
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  TOGGLE_LINK_COMMAND
} from 'lexical';

const LexicalEditor: React.FC<LexicalEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your message...",
  className = "",
}) => {
  const initialConfig = {
    namespace: 'LexicalEditor',
    theme: {
      root: 'p-3 min-h-[100px] focus:outline-none',
      paragraph: 'mb-2',
      list: {
        nested: {
          listitem: 'list-none',
        },
        ol: 'list-decimal pl-6',
        ul: 'list-disc pl-6',
        listitem: 'mb-1',
      },
      link: 'text-blue-600 hover:text-blue-800 underline',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3"
                placeholder={
                  <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
                    {placeholder}
                  </div>
                }
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LinkPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </LexicalComposer>
    </div>
  );
};

export default LexicalEditor;
