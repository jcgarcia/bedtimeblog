import { getDbPool } from './db.js';

// Privacy Policy content from Privacy.jsx - converted to Lexical format
const privacyContent = {
  "root": {
    "children": [
      {
        "type": "heading",
        "tag": "h1",
        "children": [
          {
            "type": "text",
            "text": "Privacy Policy"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Last updated: December 28, 2024"
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "1. Information We Collect"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "We collect information you provide directly to us, such as when you create an account, publish content, or contact us."
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h3",
        "children": [
          {
            "type": "text",
            "text": "Personal Information:"
          }
        ]
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Name and email address"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Account credentials"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Content you create and publish"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Communications with us"
              }
            ]
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h3",
        "children": [
          {
            "type": "text",
            "text": "Automatically Collected Information:"
          }
        ]
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "IP address and device information"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Browser type and version"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Usage data and analytics"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Cookies and similar technologies"
              }
            ]
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "2. How We Use Your Information"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "We use the information we collect to:"
          }
        ]
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Provide, maintain, and improve our services"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Process transactions and send notifications"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Respond to your comments and questions"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Monitor and analyze trends and usage"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Detect and prevent fraud and abuse"
              }
            ]
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "3. Information Sharing"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:"
          }
        ]
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "With your consent"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "To comply with legal obligations"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "To protect our rights and safety"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "In connection with a business transfer"
              }
            ]
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "4. Data Security"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction."
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "5. Your Rights"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "You have the right to:"
          }
        ]
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Access and update your information"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Delete your account"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Opt out of communications"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Request data portability"
              }
            ]
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "6. Contact Information"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "If you have any questions about this Privacy Policy, please contact us at: "
          },
          {
            "type": "text",
            "text": "admin@yourblog.com",
            "format": 1
          }
        ]
      }
    ]
  }
};

// About content
const aboutContent = {
  "root": {
    "children": [
      {
        "type": "heading",
        "tag": "h1",
        "children": [
          {
            "type": "text",
            "text": "About Us"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Welcome to our blog publishing platform. We provide a simple and intuitive way to create, manage, and publish your content online."
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "Our Mission"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Our mission is to democratize publishing by providing powerful, easy-to-use tools that enable anyone to share their ideas with the world."
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "Features"
          }
        ]
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Rich text editing with Lexical editor"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Scheduled publishing"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "User management"
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Responsive design"
              }
            ]
          }
        ]
      }
    ]
  }
};

// Terms of Service content
const termsContent = {
  "root": {
    "children": [
      {
        "type": "heading",
        "tag": "h1",
        "children": [
          {
            "type": "text",
            "text": "Terms of Service"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Last updated: December 28, 2024"
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "1. Acceptance of Terms"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement."
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "2. Use License"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Permission is granted to temporarily use this service for personal, non-commercial transitory viewing only."
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "3. Disclaimer"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "The materials on this service are provided on an 'as is' basis. We make no warranties, expressed or implied."
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "4. Limitations"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "In no event shall our company or its suppliers be liable for any damages arising out of the use or inability to use the materials on this service."
          }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "5. Contact Information"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "If you have any questions about these Terms of Service, please contact us at: "
          },
          {
            "type": "text",
            "text": "legal@yourblog.com",
            "format": 1
          }
        ]
      }
    ]
  }
};

async function migrateStaticPages() {
  const pool = getDbPool();
  
  try {
    console.log('Starting static pages migration...');
    
    // Check if pages already exist
    const existingPages = await pool.query(
      'SELECT slug FROM static_pages WHERE slug IN ($1, $2, $3)',
      ['privacy', 'about', 'terms']
    );
    
    const existingSlugs = existingPages.rows.map(row => row.slug);
    
    // Privacy Policy
    if (!existingSlugs.includes('privacy')) {
      await pool.query(
        `INSERT INTO static_pages (title, slug, content, meta_description, is_published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          'Privacy Policy',
          'privacy',
          JSON.stringify(privacyContent),
          'Our privacy policy explaining how we collect, use, and protect your information.',
          true
        ]
      );
      console.log('✓ Privacy Policy migrated');
    } else {
      console.log('- Privacy Policy already exists, skipping');
    }
    
    // About Page
    if (!existingSlugs.includes('about')) {
      await pool.query(
        `INSERT INTO static_pages (title, slug, content, meta_description, is_published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          'About Us',
          'about',
          JSON.stringify(aboutContent),
          'Learn more about our blog publishing platform and mission.',
          true
        ]
      );
      console.log('✓ About page migrated');
    } else {
      console.log('- About page already exists, skipping');
    }
    
    // Terms of Service
    if (!existingSlugs.includes('terms')) {
      await pool.query(
        `INSERT INTO static_pages (title, slug, content, meta_description, is_published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          'Terms of Service',
          'terms',
          JSON.stringify(termsContent),
          'Terms and conditions for using our blog publishing service.',
          true
        ]
      );
      console.log('✓ Terms of Service migrated');
    } else {
      console.log('- Terms of Service already exists, skipping');
    }
    
    console.log('Static pages migration completed successfully!');
    
    // Display current static pages
    const allPages = await pool.query('SELECT id, title, slug, is_published FROM static_pages ORDER BY created_at');
    console.log('\nCurrent static pages:');
    allPages.rows.forEach(page => {
      console.log(`- ${page.title} (/${page.slug}) ${page.is_published ? '[Published]' : '[Draft]'}`);
    });
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run migration if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateStaticPages()
    .then(() => {
      console.log('Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateStaticPages };
