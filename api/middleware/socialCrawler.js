import { generateMetaTags, getPostForMeta, generateSocialPreviewPage } from '../utils/metaGenerator.js';

/**
 * Check if request is from a social media crawler
 */
function isCrawler(userAgent) {
  if (!userAgent) return false;
  
  const crawlers = [
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'slackbot',
    'discordbot',
    'googlebot',
    'bingbot',
    'crawler',
    'spider',
    'bot'
  ];
  
  return crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler)
  );
}

/**
 * Social media crawler middleware
 * Serves HTML with proper meta tags for social media crawlers
 */
export const socialCrawlerMiddleware = async (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  // Only handle crawler requests
  if (!isCrawler(userAgent)) {
    return next();
  }
  
  try {
    let metaTags, htmlPage;
    
    // Check if this is a post route
    const postMatch = req.path.match(/^\/post\/(\d+)$/);
    
    if (postMatch) {
      // Handle post pages
      const postId = parseInt(postMatch[1]);
      const post = await getPostForMeta(postId);
      
      if (post) {
        metaTags = generateMetaTags('post', post);
        htmlPage = generateSocialPreviewPage(metaTags, 'post', post);
      } else {
        // Post not found, serve 404
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Post Not Found - Bedtime Blog</title>
              <meta property="og:title" content="Post Not Found" />
              <meta property="og:description" content="The requested post could not be found." />
            </head>
            <body>
              <h1>Post Not Found</h1>
              <p>The requested post could not be found.</p>
              <a href="https://bedtime.ingasti.com">← Back to Bedtime Blog</a>
            </body>
          </html>
        `);
      }
    } else {
      // Handle homepage and other routes
      metaTags = generateMetaTags('home', {});
      htmlPage = generateSocialPreviewPage(metaTags, 'home');
    }
    
    // Set proper content type and send HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlPage);
    
  } catch (error) {
    console.error('Error in social crawler middleware:', error);
    // Fallback to next middleware if error occurs
    return next();
  }
};

export default socialCrawlerMiddleware;