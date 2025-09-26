import React, { useCallback, useEffect, useState } from 'react';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TRANSFORMERS } from '@lexical/markdown';

import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getRoot
} from 'lexical';

import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingNode
} from '@lexical/rich-text';

import {
  $createListItemNode,
  $createListNode,
  $isListNode,
  ListItemNode,
  ListNode
} from '@lexical/list';

import MediaSelector from '../MediaSelector';
import './RichTextEditor.css';

// Custom plugin to handle markdown conversion
function MarkdownConverterPlugin({ value, onChange }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (value && typeof value === 'string') {
      editor.update(() => {
        try {
          $convertFromMarkdownString(value, TRANSFORMERS);
        } catch (error) {
          console.error('Error converting from markdown:', error);
          // Fallback: create simple text node
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(value));
          root.append(paragraph);
        }
      });
    }
  }, [value, editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        try {
          const markdownString = $convertToMarkdownString(TRANSFORMERS);
          onChange(markdownString);
        } catch (error) {
          console.error('Error converting to markdown:', error);
          // Fallback: get plain text
          const root = $getRoot();
          const textContent = root.getTextContent();
          onChange(textContent);
        }
      });
    });
  }, [editor, onChange]);

  return null;
}

// Toolbar component
function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1
    );
  }, [editor, updateToolbar]);

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const insertHeading = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const headingNode = $createHeadingNode('h2');
        selection.insertNodes([headingNode]);
      }
    });
  };

  const insertList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const listNode = $createListNode('bullet');
        const listItemNode = $createListItemNode();
        listItemNode.append($createTextNode('List item'));
        listNode.append(listItemNode);
        selection.insertNodes([listNode]);
      }
    });
  };

  const insertImage = (imageUrl) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const imageMarkdown = `![Image](${imageUrl})`;
        const textNode = $createTextNode(imageMarkdown);
        selection.insertNodes([textNode]);
      }
    });
    setShowMediaSelector(false);
  };

  return (
    <>
      <div className="toolbar">
        <button
          type="button"
          className={`toolbar-btn ${isBold ? 'active' : ''}`}
          onClick={() => formatText('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`toolbar-btn ${isItalic ? 'active' : ''}`}
          onClick={() => formatText('italic')}
          title="Italic"
        >
          <em>I</em>
        </button>
        <div className="toolbar-separator"></div>
        <button
          type="button"
          className="toolbar-btn"
          onClick={insertHeading}
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={insertList}
          title="Bullet List"
        >
          •List
        </button>
        <div className="toolbar-separator"></div>
        <button
          type="button"
          className="toolbar-btn image-btn"
          onClick={() => setShowMediaSelector(true)}
          title="Insert Image"
        >
          🖼️ Image
        </button>
      </div>
      
      {showMediaSelector && (
        <MediaSelector
          onSelect={insertImage}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </>
  );
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="editor-error">
      <h3>Editor Error</h3>
      <p>The rich text editor encountered an error. You can:</p>
      <button onClick={resetErrorBoundary}>Try Again</button>
      <details style={{ marginTop: '10px' }}>
        <summary>Error Details</summary>
        <pre style={{ color: 'red', fontSize: '12px' }}>
          {error.message}
        </pre>
      </details>
    </div>
  );
}

// Main editor configuration
const editorConfig = {
  namespace: 'RichTextEditor',
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode
  ],
  onError: (error) => {
    console.error('Lexical Editor Error:', error);
  },
  theme: {
    root: 'editor-root',
    paragraph: 'editor-paragraph',
    text: {
      bold: 'editor-text-bold',
      italic: 'editor-text-italic',
    },
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
    },
    list: {
      nested: {
        listitem: 'editor-nested-listitem',
      },
      ol: 'editor-list-ol',
      ul: 'editor-list-ul',
      listitem: 'editor-listitem',
    }
  }
};

// Main component
export default function RichTextEditor({ value, onChange, placeholder }) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((error) => {
    console.error('Rich Text Editor Error:', error);
    setHasError(true);
  }, []);

  const resetError = useCallback(() => {
    setHasError(false);
  }, []);

  // Fallback to simple textarea if there's an error
  if (hasError) {
    return (
      <div className="rich-text-editor">
        <div className="editor-error">
          <p>Rich text editor is temporarily unavailable. Using simple text editor:</p>
          <button onClick={resetError} className="retry-btn">
            Try Rich Editor Again
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="fallback-textarea"
          rows="20"
        />
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      <LexicalComposer initialConfig={editorConfig}>
        <Toolbar />
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-content"
                placeholder={<div className="editor-placeholder">{placeholder}</div>}
              />
            }
            ErrorBoundary={({ children, onError }) => (
              <LexicalErrorBoundary onError={handleError}>
                {children}
              </LexicalErrorBoundary>
            )}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <MarkdownConverterPlugin value={value} onChange={onChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}