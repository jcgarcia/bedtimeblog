import React, { useState, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import MediaSelector from '../MediaSelector';
import './RichTextEditor.css';

// Convert HTML to Markdown (basic conversion)
const htmlToMarkdown = (html) => {
  if (!html) return '';
  
  // Remove HTML tags and convert basic formatting
  let markdown = html
    // Convert headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    // Convert bold and italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Convert lists
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Convert images
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![Image]($1)')
    // Convert paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Convert line breaks
    .replace(/<br[^>]*>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
};

// Convert Markdown to HTML (basic conversion)
const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  let html = markdown
    // Convert headings
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Convert bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert images
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1" />')
    // Convert line breaks to paragraphs
    .split('\n\n')
    .map(paragraph => paragraph.trim() ? `<p>${paragraph.replace(/\n/g, '<br>')}</p>` : '')
    .join('');

  return html;
};

export default function RichTextEditor({ value, onChange, placeholder = "Write your post..." }) {
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const quillRef = useRef(null);
  
  // Convert markdown value to HTML for Quill
  const htmlValue = useMemo(() => markdownToHtml(value || ''), [value]);

  // Custom toolbar configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['blockquote'],
        ['image', 'link'],
        ['clean']
      ],
      handlers: {
        image: () => {
          setShowMediaSelector(true);
        }
      }
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'blockquote',
    'image', 'link'
  ];

  const handleChange = (html) => {
    // Convert HTML back to markdown
    const markdown = htmlToMarkdown(html);
    onChange(markdown);
  };

  const handleImageInsert = (imageUrl) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      
      // Insert image at cursor position
      quill.insertEmbed(index, 'image', imageUrl);
      
      // Move cursor after the image
      quill.setSelection(index + 1);
      
      // Trigger change to update markdown
      const html = quill.root.innerHTML;
      handleChange(html);
    }
    setShowMediaSelector(false);
  };

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={htmlValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          height: '400px',
          marginBottom: '50px'
        }}
      />
      
      {showMediaSelector && (
        <MediaSelector
          onSelect={handleImageInsert}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </div>
  );
}
