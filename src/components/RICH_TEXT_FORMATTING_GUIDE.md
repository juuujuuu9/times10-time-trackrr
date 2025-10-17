# Rich Text Formatting Guide

The TaskStream component now supports rich text formatting with markdown-like syntax. Here's how to use the various formatting options:

## Text Formatting

### Bold Text
- **Syntax**: `**bold text**` or `__bold text__`
- **Keyboard shortcut**: Ctrl/Cmd + B
- **Example**: `**This is bold**` → **This is bold**

### Italic Text
- **Syntax**: `*italic text*` or `_italic text_`
- **Keyboard shortcut**: Ctrl/Cmd + I
- **Example**: `*This is italic*` → *This is italic*

### Strikethrough Text
- **Syntax**: `~~strikethrough text~~`
- **Keyboard shortcut**: Ctrl/Cmd + Shift + S
- **Example**: `~~This is crossed out~~` → ~~This is crossed out~~

### Inline Code
- **Syntax**: `` `code` ``
- **Keyboard shortcut**: Ctrl/Cmd + E
- **Example**: `` `console.log('hello')` `` → `console.log('hello')`

## Lists

### Bullet Lists
- **Syntax**: `• item` or `* item` or `- item`
- **Toolbar button**: Bullet list icon
- **Example**:
  ```
  • First item
  • Second item
  • Third item
  ```

### Numbered Lists
- **Syntax**: `1. item`
- **Toolbar button**: Numbered list icon
- **Example**:
  ```
  1. First item
  2. Second item
  3. Third item
  ```

## Block Elements

### Headers
- **H1**: `# Header 1`
- **H2**: `## Header 2`
- **H3**: `### Header 3`

### Quotes
- **Syntax**: `> quoted text`
- **Toolbar button**: Quote icon
- **Example**:
  ```
  > This is a quote
  > It can span multiple lines
  ```

### Code Blocks
- **Syntax**: 
  ```
  ```
  code block
  ```
  ```
- **Toolbar button**: Code block icon
- **Example**:
  ```
  ```javascript
  function hello() {
    console.log('Hello World!');
  }
  ```
  ```

### Horizontal Rules
- **Syntax**: `---` or `***` or `___`
- **Toolbar button**: Horizontal rule icon
- **Example**: Creates a horizontal line separator

## Links

### Markdown Links
- **Syntax**: `[link text](url)`
- **Toolbar button**: Link icon
- **Example**: `[Google](https://google.com)` → [Google](https://google.com)

## Mentions

### User Mentions
- **Syntax**: `@username`
- **Behavior**: Clickable mentions that highlight the current user in red
- **Example**: `@johnD` → @johnD (clickable if not current user)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + B | Bold |
| Ctrl/Cmd + I | Italic |
| Ctrl/Cmd + Shift + S | Strikethrough |
| Ctrl/Cmd + E | Inline code |

## Toolbar Features

The rich text editor includes a floating toolbar that appears when you focus on a text input. The toolbar includes buttons for:

- **Bold** (B)
- **Italic** (I)
- **Strikethrough** (S)
- **Code** (`</>`)
- **Bullet List** (•)
- **Numbered List** (1.)
- **Quote** (">)
- **Code Block** (```)
- **Link** (🔗)
- **Horizontal Rule** (—)

## Usage Examples

### Basic Formatting
```
**Important**: This is a *critical* update that affects `all users`.

~~Old information~~ → New information
```

### Lists and Structure
```
## Project Updates

### Completed Tasks
• Fix login bug
• Update documentation
• Test new features

### Next Steps
1. Deploy to staging
2. Run integration tests
3. Deploy to production
```

### Code and Technical Content
```
Here's the function we need to implement:

```javascript
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

> **Note**: Make sure to handle edge cases where `items` might be empty.
```

### Mixed Content
```
**Meeting Notes** - *2024-01-15*

@johnD and @sarahM, here's what we discussed:

• **Priority 1**: Fix the authentication issue
• **Priority 2**: Update the UI components
• **Priority 3**: Write tests

```bash
npm run test
npm run build
```

> Let me know if you have any questions!
```

## Tips

1. **Use keyboard shortcuts** for faster formatting
2. **Combine formatting** - you can use `**bold *and italic* text**`
3. **Preview your content** - the formatting renders in real-time
4. **Use mentions** to notify team members with `@username`
5. **Structure your content** with headers and lists for better readability

The rich text editor makes it easy to create well-formatted, professional-looking posts and comments in the TaskStream!
