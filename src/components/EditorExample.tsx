import React, { useState } from 'react';
import SimpleRichEditor from './SimpleRichEditor';
import QuillEditor from './QuillEditor';
// import LexicalEditor from './LexicalEditor'; // Uncomment if you want to use Lexical

const EditorExample: React.FC = () => {
  const [content, setContent] = useState('<p>Hello <strong>world</strong>! This is a <em>test</em> of the <u>rich text editor</u>.</p>');
  const [selectedEditor, setSelectedEditor] = useState<'simple' | 'quill'>('simple');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Rich Text Editor Options</h1>
      
      {/* Editor Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose Editor:
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="editor"
              value="simple"
              checked={selectedEditor === 'simple'}
              onChange={(e) => setSelectedEditor(e.target.value as 'simple')}
              className="mr-2"
            />
            Simple HTML5 Editor (Lightweight)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="editor"
              value="quill"
              checked={selectedEditor === 'quill'}
              onChange={(e) => setSelectedEditor(e.target.value as 'quill')}
              className="mr-2"
            />
            Quill.js Editor (Feature-rich)
          </label>
        </div>
      </div>

      {/* Editor */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rich Text Editor:
        </label>
        {selectedEditor === 'simple' && (
          <SimpleRichEditor
            content={content}
            onChange={setContent}
            placeholder="Leave a message or quick note here. @mention team members to notify them."
            className="w-full"
          />
        )}
        {selectedEditor === 'quill' && (
          <QuillEditor
            content={content}
            onChange={setContent}
            placeholder="Leave a message or quick note here. @mention team members to notify them."
            className="w-full"
          />
        )}
      </div>

      {/* Content Preview */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          HTML Output:
        </label>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
          {content}
        </pre>
      </div>

      {/* Rendered Content */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rendered Content:
        </label>
        <div 
          className="border border-gray-300 p-4 rounded-lg bg-white"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Features Comparison */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Editor Features Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Simple HTML5 Editor</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Bold, Italic, Underline, Strikethrough</li>
              <li>✅ Bullet Lists, Ordered Lists</li>
              <li>✅ Links</li>
              <li>✅ Zero dependencies</li>
              <li>✅ Very lightweight</li>
              <li>✅ Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Quill.js Editor</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Bold, Italic, Underline, Strikethrough</li>
              <li>✅ Bullet Lists, Ordered Lists</li>
              <li>✅ Links</li>
              <li>✅ Professional toolbar</li>
              <li>✅ Better browser compatibility</li>
              <li>✅ Rich formatting options</li>
              <li>✅ ~45KB minified</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorExample;
