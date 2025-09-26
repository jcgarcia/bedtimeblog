import React, { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import MediaSelector from '../MediaSelector';
import './RichTextEditor.css';

export default function RichTextEditor({ value, onChange, placeholder = "Write your post..." }) {
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [editorRef, setEditorRef] = useState(null);

  const handleImageInsert = () => {
    setShowMediaSelector(true);
  };

  const insertImage = (imageUrl) => {
    if (editorRef) {
      // Insert image into TinyMCE editor
      editorRef.insertContent(`<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />`);
    }
    setShowMediaSelector(false);
  };

  return (
    <div className="rich-text-editor">
      <Editor
        apiKey="no-api-key" // Use TinyMCE without cloud - self-hosted
        value={value || ''}
        onEditorChange={(content) => onChange(content)}
        onInit={(evt, editor) => setEditorRef(editor)}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | customimage | help',
          setup: (editor) => {
            // Add custom image button that opens our MediaSelector
            editor.ui.registry.addButton('customimage', {
              text: 'Insert Image',
              icon: 'image',
              onAction: handleImageInsert
            });
          },
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
              font-size: 14px;
              line-height: 1.6; 
              color: #333;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          `,
          placeholder: placeholder,
          branding: false,
          promotion: false,
          skin: 'oxide',
          content_css: 'default',
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6;',
          formats: {
            bold: { inline: 'strong' },
            italic: { inline: 'em' }
          }
        }}
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
