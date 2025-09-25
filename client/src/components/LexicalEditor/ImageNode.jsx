/**
 * ImageNode - Custom Lexical node for handling images
 */

import { DecoratorNode } from 'lexical';
import './ImageNode.css';

export class ImageNode extends DecoratorNode {
  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__caption,
      node.__showCaption,
      node.__key
    );
  }

  constructor(src, altText, maxWidth, width, height, caption, showCaption, key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width;
    this.__height = height;
    this.__caption = caption;
    this.__showCaption = showCaption;
  }

  exportJSON() {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      maxWidth: this.__maxWidth,
      width: this.__width,
      height: this.__height,
      caption: this.__caption,
      showCaption: this.__showCaption
    };
  }

  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setSrc(src) {
    const writable = this.getWritable();
    writable.__src = src;
  }

  static importJSON(serializedNode) {
    const {
      altText,
      height,
      maxWidth = 600,
      caption,
      src,
      showCaption,
      width,
    } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      caption,
      showCaption,
      src,
      width,
    });
    return node;
  }

  exportDOM() {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText || '');
    if (this.__maxWidth) {
      element.setAttribute('style', `max-width: ${this.__maxWidth}px; height: auto;`);
    }
    return { element };
  }

  static importDOM() {
    return {
      img: (node) => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.className = 'lexical-image-wrapper';
    return div;
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

  decorate() {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        nodeKey={this.getKey()}
        caption={this.__caption}
        showCaption={this.__showCaption}
      />
    );
  }
}

function $convertImageElement(domNode) {
  const { alt: altText, src, width, height } = domNode;
  const node = $createImageNode({ altText, height, src, width });
  return { node };
}

export function $createImageNode({
  altText,
  caption,
  height,
  maxWidth = 500,
  showCaption,
  src,
  width,
  key,
}) {
  return new ImageNode(
    src,
    altText,
    maxWidth,
    width,
    height,
    caption,
    showCaption,
    key,
  );
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}

// Image Component that gets rendered
function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
  caption,
  showCaption,
}) {
  // Safety checks to prevent undefined errors
  if (!src) {
    console.warn('ImageComponent: No src provided');
    return null;
  }

  try {
    return (
      <div className="lexical-image-wrapper">
        <img
          className="lexical-image"
          src={src}
          alt={altText || ''}
          style={{
            maxWidth: maxWidth ? `${maxWidth}px` : '100%',
            height: 'auto',
            display: 'block'
          }}
          draggable="false"
          onError={(e) => {
            console.error('Image failed to load:', src);
            e.target.style.display = 'none';
          }}
        />
        {showCaption && caption && (
          <div className="lexical-image-caption">
            {caption}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering ImageComponent:', error);
    return null;
  }
}