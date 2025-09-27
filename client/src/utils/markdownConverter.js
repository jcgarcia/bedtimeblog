// Simple markdown to HTML converter for WYSIWYG editor
export const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert underline (not standard markdown but commonly used)
  html = html.replace(/__(.*?)__/g, '<u>$1</u>');
  
  // Convert line breaks to paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraph tags if not already wrapped
  if (!html.startsWith('<') && html.trim()) {
    html = '<p>' + html + '</p>';
  }
  
  // Convert unordered lists
  html = html.replace(/^\s*[\-\*\+]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Convert ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');
  
  // Fix nested list issue by ensuring proper ul/ol wrapping
  html = html.replace(/(<li>.*?<\/li>)/gs, (match) => {
    if (!match.includes('<ul>') && !match.includes('<ol>')) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });
  
  // Convert images ![alt](src)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0;" />');
  
  // Convert links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  return html;
};

// Simple HTML to markdown converter for storage
export const htmlToMarkdown = (html) => {
  if (!html) return '';
  
  let markdown = html;
  
  // Convert headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  
  // Convert bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__');
  
  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  });
  
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
  });
  
  // Convert images
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');
  
  // Convert links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Convert line breaks and paragraphs
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  markdown = markdown.replace(/<p[^>]*>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '\n\n');
  
  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();
  
  return markdown;
};