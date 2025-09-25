import { useEffect, useRef, useState } from 'react';
import { $getRoot, $getSelection, $createParagraphNode, $createTextNode, $insertNodes } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { 
  FORMAT_TEXT_COMMAND, 
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND
} from 'lexical';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';

// Nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ImageNode, $createImageNode } from './ImageNode';

// Components
import ImageDialog from './ImageDialog';

// Toolbar Component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const insertImage = (imageData) => {
    editor.update(() => {
      const imageNode = $createImageNode({
        src: imageData.src,
        altText: imageData.altText,
        caption: imageData.caption,
        showCaption: imageData.showCaption,
        width: imageData.width,
        height: imageData.height,
        maxWidth: 500
      });
      $insertNodes([imageNode]);
    });
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
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'quote')}
        className="toolbar-item"
        type="button"
        title="Quote"
      >
        <i className="fa-solid fa-quote-left"></i>
      </button>
      
      <div className="toolbar-divider"></div>
      
      <button
        onClick={() => setIsImageDialogOpen(true)}
        className="toolbar-item"
        type="button"
        title="Insert Image"
      >
        <i className="fa-solid fa-image"></i>
      </button>
      
      <ImageDialog
        isOpen={isImageDialogOpen}
        onClose={() => setIsImageDialogOpen(false)}
        onInsertImage={insertImage}
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
            // For now, just get text content to avoid serialization issues
            const root = $getRoot();
            const textContent = root.getTextContent();
            // Ensure we always pass a string
            onChange(textContent || '');
          } catch (error) {
            console.error('Error getting editor content:', error);
            // Pass empty string on error
            onChange('');
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
    // Ensure content is a string and has actual content
    if (!content || typeof content !== 'string' || !content.trim() || initialContentSet) return;
    
    console.log('SetInitialContentPlugin - setting initial content:', content);
    
    editor.update(() => {
      try {
        const root = $getRoot();
        root.clear();
        
        // Try to parse as JSON first (for rich content with images)
        try {
          const parsedContent = JSON.parse(content);
          if (parsedContent.root && parsedContent.root.children) {
            // Import the JSON state
            const editorState = editor.parseEditorState(parsedContent);
            editor.setEditorState(editorState);
            console.log('JSON content loaded successfully');
            setInitialContentSet(true);
            return;
          }
        } catch (jsonError) {
          console.log('Content is not JSON, treating as markdown/text');
        }
        
        // Fallback: treat as plain text/markdown
        const paragraphNode = $createParagraphNode();
        const textNode = $createTextNode(content);
        paragraphNode.append(textNode);
        root.append(paragraphNode);
        console.log('Text content set in editor');
        setInitialContentSet(true);
      } catch (error) {
        console.error('Error setting initial content:', error);
      }
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
  // Ensure value is always a string
  const safeValue = typeof value === 'string' ? value : '';
  
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
      ImageNode,
    ],
    onError: (error) => {
      console.error('Lexical error:', error);
      // Don't throw the error to prevent editor crashes
      return false;
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
            ErrorBoundary={({ children, error }) => {
              console.error('Lexical Editor Error:', error);
              return (
                <div style={{ color: 'red', padding: '10px' }}>
                  Editor error occurred. Please refresh the page.
                  {children}
                </div>
              );
            }}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin onChange={onChange} />
          <UpdateContentPlugin onChange={onChange} />
          <SetInitialContentPlugin content={safeValue} />
        </div>
      </LexicalComposer>
    </div>
  );
}
