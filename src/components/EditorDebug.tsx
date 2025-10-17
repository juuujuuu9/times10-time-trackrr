import React, { useState } from 'react';
import BasicTiptapEditor from './BasicTiptapEditor';

const EditorDebug: React.FC = () => {
  const [content, setContent] = useState('<p>Test content with <strong>bold</strong> and <em>italic</em> text.</p>');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Editor Debug</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          <BasicTiptapEditor
            content={content}
            onChange={(newContent) => {
              setContent(newContent);
              addLog(`Content changed: ${newContent.length} characters`);
            }}
            placeholder="Type something and use the toolbar..."
            className="w-full"
          />
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div 
            className="prose prose-sm max-w-none bg-gray-50 p-4 rounded border"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>

      {/* Raw HTML */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Raw HTML</h2>
        <pre className="bg-gray-100 p-4 rounded border text-sm overflow-x-auto">
          {content}
        </pre>
      </div>

      {/* HTML Structure Analysis */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">HTML Structure Analysis</h2>
        <div className="bg-yellow-50 p-4 rounded border">
          <p className="text-sm mb-2">Check if the HTML structure is correct:</p>
          <ul className="text-sm space-y-1">
            <li>• Lists should have &lt;ul&gt; and &lt;li&gt; tags</li>
            <li>• List items should contain text directly or in &lt;p&gt; tags</li>
            <li>• No extra line breaks between bullets and text</li>
          </ul>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-40 overflow-y-auto">
          {logs.length === 0 ? 'No logs yet...' : logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Test Content</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setContent('<p>Simple paragraph</p>')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Simple Text
          </button>
          <button
            onClick={() => setContent('<p>Text with <strong>bold</strong> and <em>italic</em></p>')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Bold & Italic
          </button>
          <button
            onClick={() => setContent('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Bullet List
          </button>
          <button
            onClick={() => setContent('<p>Line 1<br>Line 2<br>Line 3</p>')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Line Breaks
          </button>
          <button
            onClick={() => setContent('<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Bullet List
          </button>
          <button
            onClick={() => setContent('<p>Type some text first, then select it and click the bullet list button in the toolbar.</p>')}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Instructions
          </button>
          <button
            onClick={() => setContent('<ol><li>First</li><li>Second</li><li>Third</li></ol>')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Numbered List
          </button>
          <button
            onClick={() => setContent('<blockquote><p>This is a quote</p></blockquote>')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quote
          </button>
          <button
            onClick={() => setContent('<pre><code>console.log("Hello World");</code></pre>')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Code Block
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorDebug;
