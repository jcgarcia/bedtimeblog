import { useEffect, useRef, useState } from 'react';
import { $getRoot, $getSelection, $createParagraphNode, $createTextNode } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { 
  FORMAT_TEXT_COMMAND, 
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $insertNodes,
  $isRootOrShadowRoot,
  $getNodeByKey
} from 'lexical';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { $wrapNodeInElement } from '@lexical/utils';

// Nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';

// Simple Image Node
import { DecoratorNode } from 'lexical';

export class ImageNode extends DecoratorNode {
  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__altText, node.__width, node.__height, node.__key);
  }

  constructor(src, altText, width, height, key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  createDOM() {
    const span = document.createElement('span');
    return span;
  }

  updateDOM() {
    return false;
  }

  getSrc() {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
  }

  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  decorate() {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{
          width: this.__width || 'auto',
          height: this.__height || 'auto',
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          margin: '10px auto'
        }}
      />
    );
  }

  static importJSON(serializedNode) {
    const { src, altText, width, height } = serializedNode;
    const node = $createImageNode(src, altText, width, height);
    return node;
  }

  exportJSON() {
    return {
      altText: this.getAltText(),
      height: this.__height,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width,
    };
  }
}

export function $createImageNode(src, altText, width, height) {
  return new ImageNode(src, altText, width, height);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}

// Toolbar Component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef(null);

  const insertImage = (src, altText = '') => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        const imageNode = $createImageNode(src, altText);
        $insertNodes([imageNode]);
      }
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create FormData to upload the file
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use the same upload API as the featured image
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const imagePath = `/uploads/${data}`;
        insertImage(imagePath, file.name);
      } else {
        console.error('Failed to upload image');
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="lexical-toolbar">
      <button
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="toolbar-item"
        type="button"
        title="Undo"
      >
        <i className="fa-solid fa-undo"></i>
      </button>
      <button
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="toolbar-item"
        type="button"
        title="Redo"
      >
        <i className="fa-solid fa-redo"></i>
      </button>
      
      <div className="toolbar-divider"></div>
      
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className="toolbar-item"
        type="button"
        title="Bold"
      >
        <i className="fa-solid fa-bold"></i>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className="toolbar-item"
        type="button"
        title="Italic"
      >
        <i className="fa-solid fa-italic"></i>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className="toolbar-item"
        type="button"
        title="Underline"
      >
        <i className="fa-solid fa-underline"></i>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        className="toolbar-item"
        type="button"
        title="Strikethrough"
      >
        <i className="fa-solid fa-strikethrough"></i>
      </button>
      
      <div className="toolbar-divider"></div>
      
      <button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'h1')}
        className="toolbar-item"
        type="button"
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'h2')}
        className="toolbar-item"
        type="button"
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'h3')}
        className="toolbar-item"
        type="button"
        title="Heading 3"
      >
        H3
      </button>
      
      <div className="toolbar-divider"></div>
      
      <button
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        className="toolbar-item"
        type="button"
        title="Bullet List"
      >
        <i className="fa-solid fa-list-ul"></i>
      </button>
      <button
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        className="toolbar-item"
        type="button"
        title="Numbered List"
      >
        <i className="fa-solid fa-list-ol"></i>
      </button>
      
      <div className="toolbar-divider"></div>
      
      <button
        onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
        className="toolbar-item"
        type="button"
        title="Indent"
      >
        <i className="fa-solid fa-indent"></i>
      </button>
      <button
        onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
        className="toolbar-item"
        type="button"
        title="Outdent"
      >
        <i className="fa-solid fa-outdent"></i>
      </button>
      
      <div className="toolbar-divider"></div>
      
      <button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'quote')}
        className="toolbar-item"
        type="button"
        title="Quote"
      >
        <i className="fa-solid fa-quote-left"></i>
      </button>
      
      <div className="toolbar-divider"></div>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="toolbar-item"
        type="button"
        title="Insert Image"
      >
        <i className="fa-solid fa-image"></i>
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
}

// Update content plugin
function UpdateContentPlugin({ onChange }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      // Only trigger onChange if there are actual changes and it's not just a selection change
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        editorState.read(() => {
          try {
            // Export the full editor state as JSON to preserve formatting
            const serializedState = JSON.stringify(editorState.toJSON());
            onChange(serializedState);
          } catch (error) {
            console.error('Error serializing editor state:', error);
            // Fallback to text content if JSON serialization fails
            const root = $getRoot();
            onChange(root.getTextContent());
          }
        });
      }
    });
  }, [editor, onChange]);

  return null;
}

// Set initial content plugin
function SetInitialContentPlugin({ content }) {
  const [editor] = useLexicalComposerContext();
  const [initialContentSet, setInitialContentSet] = useState(false);

  useEffect(() => {
    if (!content || !content.trim() || initialContentSet) return;
    
    console.log('SetInitialContentPlugin - setting initial content:', content); // Debug log
    
    editor.update(() => {
      try {
        // Try to parse as JSON first (Lexical format)
        const parsedContent = JSON.parse(content);
        if (parsedContent && parsedContent.root) {
          // This is Lexical JSON format, set the editor state
          const editorState = editor.parseEditorState(content);
          editor.setEditorState(editorState);
          console.log('Lexical JSON content loaded successfully'); // Debug log
        } else {
          throw new Error('Not valid Lexical JSON');
        }
      } catch (error) {
        // If JSON parsing fails, treat as plain text
        console.log('Content is not Lexical JSON, treating as plain text:', error.message);
        const root = $getRoot();
        root.clear();
        
        // Create a paragraph node and add the text content
        const paragraphNode = $createParagraphNode();
        const textNode = $createTextNode(content);
        paragraphNode.append(textNode);
        root.append(paragraphNode);
        console.log('Plain text content set in editor'); // Debug log
      }
      setInitialContentSet(true);
    });
  }, [content, editor, initialContentSet]);

  return null;
}

// Main Lexical Editor Component
export default function LexicalEditor({ 
  value = '', 
  onChange = () => {}, 
  placeholder = 'Start writing your story...',
  className = ''
}) {
  const initialConfig = {
    namespace: 'BlogEditor',
    theme: {
      root: 'lexical-editor',
      paragraph: 'lexical-paragraph',
      quote: 'lexical-quote',
      heading: {
        h1: 'lexical-heading-h1',
        h2: 'lexical-heading-h2',
        h3: 'lexical-heading-h3',
        h4: 'lexical-heading-h4',
        h5: 'lexical-heading-h5',
        h6: 'lexical-heading-h6',
      },
      list: {
        nested: {
          listitem: 'lexical-nested-listitem',
        },
        ol: 'lexical-list-ol',
        ul: 'lexical-list-ul',
        listitem: 'lexical-listitem',
      },
      code: 'lexical-code',
      codeHighlight: {
        atrule: 'lexical-token-attr',
        attr: 'lexical-token-attr',
        boolean: 'lexical-token-boolean',
        builtin: 'lexical-token-builtin',
        cdata: 'lexical-token-cdata',
        char: 'lexical-token-char',
        class: 'lexical-token-class',
        'class-name': 'lexical-token-class-name',
        comment: 'lexical-token-comment',
        constant: 'lexical-token-constant',
        deleted: 'lexical-token-deleted',
        doctype: 'lexical-token-doctype',
        entity: 'lexical-token-entity',
        function: 'lexical-token-function',
        important: 'lexical-token-important',
        inserted: 'lexical-token-inserted',
        keyword: 'lexical-token-keyword',
        namespace: 'lexical-token-namespace',
        number: 'lexical-token-number',
        operator: 'lexical-token-operator',
        prolog: 'lexical-token-prolog',
        property: 'lexical-token-property',
        punctuation: 'lexical-token-punctuation',
        regex: 'lexical-token-regex',
        selector: 'lexical-token-selector',
        string: 'lexical-token-string',
        symbol: 'lexical-token-symbol',
        tag: 'lexical-token-tag',
        url: 'lexical-token-url',
        variable: 'lexical-token-variable',
      },
      link: 'lexical-link',
      text: {
        bold: 'lexical-text-bold',
        italic: 'lexical-text-italic',
        underline: 'lexical-text-underline',
        strikethrough: 'lexical-text-strikethrough',
        underlineStrikethrough: 'lexical-text-underlineStrikethrough',
        code: 'lexical-text-code',
      },
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      ImageNode,
    ],
    onError: (error) => {
      console.error('Lexical error:', error);
    },
  };

  return (
    <div className={`lexical-container ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="lexical-editor-wrapper">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="lexical-content-editable" />
            }
            placeholder={
              <div className="lexical-placeholder">{placeholder}</div>
            }
            ErrorBoundary={({ children }) => children}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TablePlugin />
          <OnChangePlugin onChange={onChange} />
          <UpdateContentPlugin onChange={onChange} />
          <SetInitialContentPlugin content={value} />
        </div>
      </LexicalComposer>
    </div>
  );
}
