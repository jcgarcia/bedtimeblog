import React, { useState, useRef, useEffect } from 'react';
import MediaSelector from '../MediaSelector';
import './RichTextEditor.css';

export default function RichTextEditor({ value, onChange, placeholder = "Write your post..." }) {
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const insertImage = (imageUrl) => {
    if (editorRef.current) {
      // Focus the editor first
      editorRef.current.focus();
      
      // Insert image at cursor position
      const img = `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      formatText('insertHTML', img);
    }
    setShowMediaSelector(false);
  };

  const handleKeyDown = (e) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
      }
    }
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('bold')}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('italic')}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('underline')}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        
        <div className="toolbar-separator"></div>
        
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('formatBlock', 'h1')}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('formatBlock', 'h2')}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('formatBlock', 'h3')}
          title="Heading 3"
        >
          H3
        </button>
        
        <div className="toolbar-separator"></div>
        
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('insertUnorderedList')}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('insertOrderedList')}
          title="Numbered List"
        >
          1.
        </button>
        
        <div className="toolbar-separator"></div>
        
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setShowMediaSelector(true)}
          title="Insert Image"
        >
          🖼️
        </button>
        
        <div className="toolbar-separator"></div>
        
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => formatText('removeFormat')}
          title="Clear Formatting"
        >
          ✕
        </button>
      </div>

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        style={{
          minHeight: '400px',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          lineHeight: '1.6',
          fontFamily: '-apple-system, BlinkMacSystemFont, "San Francisco", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          outline: 'none',
          backgroundColor: '#fff'
        }}
        data-placeholder={placeholder}
      />

      {showMediaSelector && (
        <MediaSelector
          onSelect={insertImage}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </div>
  );
}
