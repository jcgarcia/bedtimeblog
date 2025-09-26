import React, { useState } from 'react';import React from 'react';

import { Editor } from '@tinymce/tinymce-react';import { Editor } from '@tinymce/tinymce-react';

import MediaSelector from '../MediaSelector';import './RichTextEditor.css';

import './RichTextEditor.css';

// Simple but functional rich text editor with markdown support

export default function RichTextEditor({ value, onChange, placeholder = "Write your post..." }) {export default function RichTextEditor({ value, onChange, placeholder = "Write your post..." }) {

  const [showMediaSelector, setShowMediaSelector] = useState(false);  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const [editorRef, setEditorRef] = useState(null);  const textareaRef = useRef(null);



  const handleImageInsert = () => {  const insertAtCursor = (text) => {

    setShowMediaSelector(true);    const textarea = textareaRef.current;

  };    if (!textarea) return;



  const insertImage = (imageUrl) => {    const start = textarea.selectionStart;

    if (editorRef) {    const end = textarea.selectionEnd;

      // Insert image into TinyMCE editor    const currentValue = value || '';

      editorRef.insertContent(`<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />`);    

    }    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);

    setShowMediaSelector(false);    onChange(newValue);

  };

    // Restore cursor position after the inserted text

  return (    setTimeout(() => {

    <div className="rich-text-editor">      const newPosition = start + text.length;

      <Editor      textarea.setSelectionRange(newPosition, newPosition);

        apiKey="no-api-key" // Use TinyMCE without cloud - self-hosted      textarea.focus();

        value={value || ''}    }, 0);

        onEditorChange={(content) => onChange(content)}  };

        onInit={(evt, editor) => setEditorRef(editor)}

        init={{  const wrapSelection = (before, after = before) => {

          height: 500,    const textarea = textareaRef.current;

          menubar: false,    if (!textarea) return;

          plugins: [

            'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',    const start = textarea.selectionStart;

            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',    const end = textarea.selectionEnd;

            'insertdatetime', 'table', 'help', 'wordcount'    const currentValue = value || '';

          ],    const selectedText = currentValue.substring(start, end);

          toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | customimage | help',    

          setup: (editor) => {    const newText = before + selectedText + after;

            // Add custom image button that opens our MediaSelector    const newValue = currentValue.substring(0, start) + newText + currentValue.substring(end);

            editor.ui.registry.addButton('customimage', {    onChange(newValue);

              text: 'Insert Image',

              icon: 'image',    // Restore selection after the formatting

              onAction: handleImageInsert    setTimeout(() => {

            });      const newStart = start + before.length;

          },      const newEnd = newStart + selectedText.length;

          content_style: `      textarea.setSelectionRange(newStart, newEnd);

            body {       textarea.focus();

              font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;     }, 0);

              font-size: 14px;   };

              line-height: 1.6; 

              color: #333;  const formatBold = () => wrapSelection('**');

            }  const formatItalic = () => wrapSelection('*');

            img {  const formatHeading = () => {

              max-width: 100%;    const textarea = textareaRef.current;

              height: auto;    if (!textarea) return;

            }    

          `,    const start = textarea.selectionStart;

          placeholder: placeholder,    const currentValue = value || '';

          branding: false,    

          promotion: false,    // Find start of current line

          skin: 'oxide',    const lineStart = currentValue.lastIndexOf('\n', start - 1) + 1;

          content_css: 'default',    const lineEnd = currentValue.indexOf('\n', start);

          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6;',    const actualLineEnd = lineEnd === -1 ? currentValue.length : lineEnd;

          formats: {    

            bold: { inline: 'strong' },    const currentLine = currentValue.substring(lineStart, actualLineEnd);

            italic: { inline: 'em' }    const newLine = currentLine.startsWith('## ') ? currentLine.substring(3) : '## ' + currentLine;

          }    

        }}    const newValue = currentValue.substring(0, lineStart) + newLine + currentValue.substring(actualLineEnd);

      />    onChange(newValue);

  };

      {showMediaSelector && (

        <MediaSelector  const formatList = () => {

          onSelect={insertImage}    insertAtCursor('\n- ');

          onClose={() => setShowMediaSelector(false)}  };

        />

      )}  const formatQuote = () => {

    </div>    const textarea = textareaRef.current;

  );    if (!textarea) return;

}    
    const start = textarea.selectionStart;
    const currentValue = value || '';
    
    // Find start of current line
    const lineStart = currentValue.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = currentValue.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? currentValue.length : lineEnd;
    
    const currentLine = currentValue.substring(lineStart, actualLineEnd);
    const newLine = currentLine.startsWith('> ') ? currentLine.substring(2) : '> ' + currentLine;
    
    const newValue = currentValue.substring(0, lineStart) + newLine + currentValue.substring(actualLineEnd);
    onChange(newValue);
  };

  const insertImage = (imageUrl) => {
    const imageMarkdown = `![Image](${imageUrl})`;
    insertAtCursor(imageMarkdown);
    setShowMediaSelector(false);
  };

  return (
    <>
      <div className="editor-toolbar">
        <button
          type="button"
          className="toolbar-btn"
          onClick={formatBold}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={formatItalic}
          title="Italic"
        >
          <em>I</em>
        </button>
        <div className="toolbar-separator"></div>
        <button
          type="button"
          className="toolbar-btn"
          onClick={formatHeading}
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={formatList}
          title="List"
        >
          •
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={formatQuote}
          title="Quote"
        >
          "
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
      </div>
      
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={20}
      />

      {showMediaSelector && (
        <MediaSelector
          onSelect={insertImage}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </>
  );
}
