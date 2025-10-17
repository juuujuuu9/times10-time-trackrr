import React, { useState } from 'react';
import SimpleTiptapEditor from './SimpleTiptapEditor';

const RichTextDemo: React.FC = () => {
  const [content, setContent] = useState(`
    <h2>Welcome to Rich Text Formatting!</h2>
    <p>This is a <strong>bold</strong> text example.</p>
    <p>This is an <em>italic</em> text example.</p>
    <p>This is a <s>strikethrough</s> text example.</p>
    <p>This is <code>inline code</code> example.</p>
    
    <h3>Lists</h3>
    <ul>
      <li>Bullet point 1</li>
      <li>Bullet point 2</li>
      <li>Bullet point 3</li>
    </ul>
    
    <ol>
      <li>Numbered item 1</li>
      <li>Numbered item 2</li>
      <li>Numbered item 3</li>
    </ol>
    
    <h3>Block Elements</h3>
    <blockquote>
      <p>This is a blockquote example. It can contain multiple paragraphs and other formatting.</p>
    </blockquote>
    
    <pre><code>// This is a code block
function hello() {
  console.log('Hello World!');
}</code></pre>
    
    <p>Here's a <a href="https://example.com">link example</a>.</p>
    
    <hr>
    
    <p>Try editing this content using the toolbar above!</p>
  `);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Rich Text Editor Demo</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Editor</h2>
        <SimpleTiptapEditor
          content={content}
          onChange={setContent}
          placeholder="Start typing to see the rich text features..."
          className="w-full"
        />
      </div>
      
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Features Available</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <strong>Bold</strong>
            <span className="text-sm text-gray-600">Ctrl+B</span>
          </div>
          <div className="flex items-center space-x-2">
            <em>Italic</em>
            <span className="text-sm text-gray-600">Ctrl+I</span>
          </div>
          <div className="flex items-center space-x-2">
            <s>Strikethrough</s>
            <span className="text-sm text-gray-600">Ctrl+Shift+S</span>
          </div>
          <div className="flex items-center space-x-2">
            <code>Code</code>
            <span className="text-sm text-gray-600">Ctrl+E</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>• Bullet Lists</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>1. Numbered Lists</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Blockquotes</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Code Blocks</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Links</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Horizontal Rules</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextDemo;
