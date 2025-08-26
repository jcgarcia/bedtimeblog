import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { staticPagesAPI } from '../../config/apiService';
import './DynamicPage.css';

export default function DynamicPage() {
  const { slug } = useParams();
  const location = useLocation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get slug from URL path if not in params
  const currentSlug = slug || location.pathname.replace('/', '');

  useEffect(() => {
    loadPage();
  }, [currentSlug]);

  const loadPage = async () => {
    if (!currentSlug) return;
    
    try {
      setLoading(true);
      const response = await staticPagesAPI.getPageBySlug(currentSlug);
      
      if (response.success && response.data) {
        setPage(response.data);
      } else {
        setError('Page not found');
      }
    } catch (err) {
      console.error('Error loading page:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content) => {
    if (!content) return '';
    // Try Lexical JSON parsing first
    let parsedContent;
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      parsedContent = null;
    }
    // Lexical JSON root node
    if (parsedContent && parsedContent.root && parsedContent.root.children) {
      return renderLexicalContent(parsedContent.root);
    }
    // Lexical JSON direct root
    if (parsedContent && parsedContent.type === 'root' && parsedContent.children) {
      return renderLexicalContent(parsedContent);
    }
    // Array of nodes (rare)
    if (Array.isArray(parsedContent)) {
      return renderLexicalContent({ children: parsedContent });
    }
    // If it's a string, treat as HTML
    if (typeof parsedContent === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: parsedContent }} />;
    }
  // Plain text formatting fallback
  let html = typeof content === 'string' ? content : '';
  // Convert double newlines to paragraphs
  html = html.replace(/\n{2,}/g, '</p><p>');
  // Convert single newlines to line breaks
  html = html.replace(/\n/g, '<br>');
  // Headings: lines starting with numbers or section titles
  html = html.replace(/(<br>|^)(\d+\. [^<]+)/g, '$1<h2>$2</h2>');
  html = html.replace(/(<br>|^)(Terms of Service|Privacy Policy)/g, '$1<h1>$2</h1>');
  html = html.replace(/(<br>|^)(Last updated:.*)/g, '$1<p class="last-updated">$2</p>');
  // Wrap in paragraph if not already
  if (!/^<p>/.test(html)) html = `<p>${html}</p>`;
  // Remove extra <p></p> if already present
  html = html.replace(/(<p><\/p>)+/g, '');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const renderLexicalContent = (root) => {
    if (!root || !root.children) return '';
    
    return (
      <div className="lexical-content">
        {root.children.map((node, index) => renderLexicalNode(node, index))}
      </div>
    );
  };

  const renderLexicalNode = (node, index) => {
    if (!node) return null;

    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index}>
            {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
          </p>
        );
      
      case 'heading':
        const HeadingTag = `h${node.tag}`;
        return React.createElement(
          HeadingTag,
          { key: index },
          node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))
        );
      
      case 'text':
        let textElement = node.text || '';
        
        // Apply formatting
        if (node.format && node.format > 0) {
          if (node.format & 1) textElement = <strong key={index}>{textElement}</strong>; // Bold
          if (node.format & 2) textElement = <em key={index}>{textElement}</em>; // Italic
          if (node.format & 8) textElement = <u key={index}>{textElement}</u>; // Underline
        }
        
        return textElement;
      
      case 'list':
        const ListTag = node.listType === 'number' ? 'ol' : 'ul';
        return React.createElement(
          ListTag,
          { key: index },
          node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))
        );
      
      case 'listitem':
        return (
          <li key={index}>
            {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
          </li>
        );
      
      case 'quote':
        return (
          <blockquote key={index}>
            {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
          </blockquote>
        );
      
      default:
        // For unknown node types, try to render children
        if (node.children) {
          return (
            <div key={index}>
              {node.children.map((child, childIndex) => renderLexicalNode(child, childIndex))}
            </div>
          );
        }
        return null;
    }
  };

  if (loading) {
    return (
      <div className="dynamic-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading page...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dynamic-page-error">
        <h1>Page Not Found</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="dynamic-page-error">
        <h1>Page Not Found</h1>
        <p>The requested page could not be found.</p>
      </div>
    );
  }

  return (
    <div className="dynamic-page">
      <div className="dynamic-page-content">
        <h1>{page.title}</h1>
        {page.updated_at && (
          <p className="last-updated">
            Last updated: {new Date(page.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
        <div className="page-content">
          {renderContent(page.content)}
        </div>
      </div>
    </div>
  );
}
