import React, { useEffect, useRef } from 'react';

interface QuillEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your message...",
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import Quill to avoid SSR issues
    const loadQuill = async () => {
      if (typeof window !== 'undefined' && editorRef.current && !quillRef.current) {
        try {
          const Quill = (await import('quill')).default;
          await import('quill/dist/quill.snow.css');

          quillRef.current = new Quill(editorRef.current, {
            theme: 'snow',
            placeholder,
            modules: {
              toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            },
            formats: [
              'bold', 'italic', 'underline', 'strike',
              'list', 'bullet', 'link'
            ]
          });

          // Set initial content
          if (content) {
            quillRef.current.root.innerHTML = content;
          }

          // Listen for changes
          quillRef.current.on('text-change', () => {
            const html = quillRef.current.root.innerHTML;
            onChange(html);
          });

        } catch (error) {
          console.error('Failed to load Quill:', error);
        }
      }
    };

    loadQuill();

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  // Update content when prop changes
  useEffect(() => {
    if (quillRef.current && content !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = content;
    }
  }, [content]);

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      <div ref={editorRef} className="min-h-[100px]" />
    </div>
  );
};

export default QuillEditor;
