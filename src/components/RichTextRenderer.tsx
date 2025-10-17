import React from 'react';

interface RichTextRendererProps {
  content: string;
  className?: string;
  renderMentions?: (text: string) => React.ReactNode;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = "",
  renderMentions
}) => {
  const parseMarkdown = (text: string): React.ReactNode => {
    if (!text) return null;

    // Split by lines to handle block elements
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let listDepth = 0;
    let listType: 'bullet' | 'number' | null = null;

    const processLine = (line: string, index: number): React.ReactNode => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = [];
          return null;
        } else {
          inCodeBlock = false;
          const codeContent = codeBlockContent.join('\n');
          codeBlockContent = [];
          return (
            <pre key={`code-${index}`} className="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2">
              <code className="text-sm font-mono">{codeContent}</code>
            </pre>
          );
        }
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return null;
      }

      // Handle horizontal rules
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
        return <hr key={`hr-${index}`} className="my-4 border-gray-300" />;
      }

      // Handle quotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={`quote-${index}`} className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-700">
            {parseInlineMarkdown(line.substring(2))}
          </blockquote>
        );
      }

      // Handle lists
      const bulletMatch = line.match(/^(\s*)(•|\*|\-)\s(.+)$/);
      const numberMatch = line.match(/^(\s*)(\d+)\.\s(.+)$/);

      if (bulletMatch) {
        const [, indent, , content] = bulletMatch;
        const depth = Math.floor(indent.length / 2);
        return (
          <div key={`bullet-${index}`} className={`ml-${depth * 4} flex items-start my-1`}>
            <span className="mr-2 text-gray-600">•</span>
            <span>{parseInlineMarkdown(content)}</span>
          </div>
        );
      }

      if (numberMatch) {
        const [, indent, number, content] = numberMatch;
        const depth = Math.floor(indent.length / 2);
        return (
          <div key={`number-${index}`} className={`ml-${depth * 4} flex items-start my-1`}>
            <span className="mr-2 text-gray-600">{number}.</span>
            <span>{parseInlineMarkdown(content)}</span>
          </div>
        );
      }

      // Handle headers
      if (line.startsWith('### ')) {
        return <h3 key={`h3-${index}`} className="text-lg font-semibold mt-4 mb-2">{parseInlineMarkdown(line.substring(4))}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={`h2-${index}`} className="text-xl font-semibold mt-4 mb-2">{parseInlineMarkdown(line.substring(3))}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={`h1-${index}`} className="text-2xl font-bold mt-4 mb-2">{parseInlineMarkdown(line.substring(2))}</h1>;
      }

      // Handle empty lines
      if (line.trim() === '') {
        return <br key={`br-${index}`} />;
      }

      // Regular paragraph
      return (
        <p key={`p-${index}`} className="my-2">
          {parseInlineMarkdown(line)}
        </p>
      );
    };

    const parseInlineMarkdown = (text: string): React.ReactNode => {
      if (!text) return null;

      // Handle mentions first if renderMentions is provided
      if (renderMentions) {
        return renderMentions(text);
      }

      // Parse inline formatting
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        // Code (backticks)
        const codeMatch = remaining.match(/`([^`]+)`/);
        if (codeMatch) {
          const beforeCode = remaining.substring(0, codeMatch.index);
          if (beforeCode) {
            parts.push(parseInlineFormatting(beforeCode, key++));
          }
          parts.push(
            <code key={key++} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
              {codeMatch[1]}
            </code>
          );
          remaining = remaining.substring(codeMatch.index! + codeMatch[0].length);
          continue;
        }

        // Bold (**text**)
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          const beforeBold = remaining.substring(0, boldMatch.index);
          if (beforeBold) {
            parts.push(parseInlineFormatting(beforeBold, key++));
          }
          parts.push(<strong key={key++} className="font-bold">{boldMatch[1]}</strong>);
          remaining = remaining.substring(boldMatch.index! + boldMatch[0].length);
          continue;
        }

        // Italic (*text*)
        const italicMatch = remaining.match(/\*([^*]+)\*/);
        if (italicMatch) {
          const beforeItalic = remaining.substring(0, italicMatch.index);
          if (beforeItalic) {
            parts.push(parseInlineFormatting(beforeItalic, key++));
          }
          parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
          remaining = remaining.substring(italicMatch.index! + italicMatch[0].length);
          continue;
        }

        // Strikethrough (~~text~~)
        const strikeMatch = remaining.match(/~~([^~]+)~~/);
        if (strikeMatch) {
          const beforeStrike = remaining.substring(0, strikeMatch.index);
          if (beforeStrike) {
            parts.push(parseInlineFormatting(beforeStrike, key++));
          }
          parts.push(<del key={key++} className="line-through">{strikeMatch[1]}</del>);
          remaining = remaining.substring(strikeMatch.index! + strikeMatch[0].length);
          continue;
        }

        // Links [text](url)
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const beforeLink = remaining.substring(0, linkMatch.index);
          if (beforeLink) {
            parts.push(parseInlineFormatting(beforeLink, key++));
          }
          parts.push(
            <a 
              key={key++} 
              href={linkMatch[2]} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {linkMatch[1]}
            </a>
          );
          remaining = remaining.substring(linkMatch.index! + linkMatch[0].length);
          continue;
        }

        // No more formatting found, add the rest as plain text
        parts.push(parseInlineFormatting(remaining, key++));
        break;
      }

      return parts.length === 1 ? parts[0] : parts;
    };

    const parseInlineFormatting = (text: string, key: number): React.ReactNode => {
      // Handle line breaks
      if (text.includes('\n')) {
        return text.split('\n').map((line, index) => (
          <React.Fragment key={`${key}-${index}`}>
            {line}
            {index < text.split('\n').length - 1 && <br />}
          </React.Fragment>
        ));
      }
      return text;
    };

    // Process all lines
    const processedLines = lines.map((line, index) => processLine(line, index));
    
    return (
      <div className={className}>
        {processedLines.filter(Boolean)}
      </div>
    );
  };

  return <>{parseMarkdown(content)}</>;
};

export default RichTextRenderer;
