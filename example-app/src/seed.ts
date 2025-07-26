import prisma from './lib/prisma';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Technology',
        description: 'All about technology, programming, and innovation',
        slug: 'technology',
        color: '#3B82F6',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Lifestyle',
        description: 'Tips and insights about modern lifestyle',
        slug: 'lifestyle',
        color: '#10B981',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Business',
        description: 'Business strategies, entrepreneurship, and market insights',
        slug: 'business',
        color: '#F59E0B',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Science',
        description: 'Scientific discoveries and research findings',
        slug: 'science',
        color: '#8B5CF6',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        bio: 'Full-stack developer passionate about web technologies and clean code.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        bio: 'Tech entrepreneur and blogger. Love sharing insights about startup life.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'alice.johnson@example.com',
        name: 'Alice Johnson',
        bio: 'Data scientist with a passion for machine learning and AI research.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob.wilson@example.com',
        name: 'Bob Wilson',
        bio: 'Senior software architect with 15+ years of experience in enterprise solutions.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        isActive: false,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        title: 'Getting Started with Prisma and TypeScript',
        content: 'In this comprehensive guide, we will explore how to set up Prisma with TypeScript for modern web applications. Prisma provides an excellent developer experience with type-safe database access...',
        published: true,
        featured: true,
        slug: 'getting-started-prisma-typescript',
        tags: JSON.stringify(['prisma', 'typescript', 'database', 'orm']),
        authorId: users[0].id,
        viewCount: 245,
        likes: 18,
        publishedAt: new Date('2024-01-15'),
      },
    }),
    prisma.post.create({
      data: {
        title: 'The Future of Web Development',
        content: 'Web development is evolving rapidly with new frameworks, tools, and paradigms emerging constantly. In this article, we examine the trends that will shape the future of web development...',
        published: true,
        featured: false,
        slug: 'future-web-development',
        tags: JSON.stringify(['web-development', 'trends', 'future', 'technology']),
        authorId: users[1].id,
        viewCount: 189,
        likes: 24,
        publishedAt: new Date('2024-01-20'),
      },
    }),
    prisma.post.create({
      data: {
        title: 'Building Scalable APIs with Express.js',
        content: 'Learn how to build robust and scalable APIs using Express.js, including best practices for middleware, error handling, validation, and performance optimization...',
        published: true,
        featured: true,
        slug: 'scalable-apis-express',
        tags: JSON.stringify(['express', 'api', 'node.js', 'backend']),
        authorId: users[0].id,
        viewCount: 312,
        likes: 31,
        publishedAt: new Date('2024-01-25'),
      },
    }),
    prisma.post.create({
      data: {
        title: 'Machine Learning in Practice',
        content: 'A practical guide to implementing machine learning solutions in real-world applications. We will cover data preprocessing, model selection, training, and deployment strategies...',
        published: true,
        featured: false,
        slug: 'machine-learning-practice',
        tags: JSON.stringify(['machine-learning', 'ai', 'data-science', 'python']),
        authorId: users[2].id,
        viewCount: 156,
        likes: 22,
        publishedAt: new Date('2024-02-01'),
      },
    }),
    prisma.post.create({
      data: {
        title: 'Draft: Advanced React Patterns',
        content: 'This is a draft post about advanced React patterns including render props, higher-order components, and custom hooks...',
        published: false,
        featured: false,
        slug: 'advanced-react-patterns',
        tags: JSON.stringify(['react', 'patterns', 'javascript', 'frontend']),
        authorId: users[1].id,
        viewCount: 0,
        likes: 0,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Database Design Best Practices',
        content: 'Designing efficient and maintainable database schemas is crucial for application performance. In this guide, we explore normalization, indexing, and optimization strategies...',
        published: true,
        featured: false,
        slug: 'database-design-best-practices',
        tags: JSON.stringify(['database', 'design', 'sql', 'optimization']),
        authorId: users[3].id,
        viewCount: 98,
        likes: 12,
        publishedAt: new Date('2024-02-05'),
      },
    }),
  ]);

  console.log(`✅ Created ${posts.length} posts`);

  // Create comments
  const comments = [];
  for (const post of posts.slice(0, 4)) { // Only add comments to published posts
    const postComments = await Promise.all([
      prisma.comment.create({
        data: {
          content: 'Great article! This really helped me understand the concepts better.',
          author: 'Sarah Chen',
          email: 'sarah.chen@example.com',
          postId: post.id,
        },
      }),
      prisma.comment.create({
        data: {
          content: 'Thanks for sharing this. I have been looking for a comprehensive guide like this.',
          author: 'Mike Rodriguez',
          email: 'mike.rodriguez@example.com',
          postId: post.id,
        },
      }),
      prisma.comment.create({
        data: {
          content: 'Excellent explanation! Could you write a follow-up post about deployment strategies?',
          author: 'Emma Thompson',
          email: 'emma.thompson@example.com',
          postId: post.id,
        },
      }),
    ]);
    comments.push(...postComments);
  }

  console.log(`✅ Created ${comments.length} comments`);

  // Add extra comments to the first post to demonstrate pagination
  const extraComments = await Promise.all([
    prisma.comment.create({
      data: {
        content: 'I encountered an issue with the setup. Could you provide more details on the configuration?',
        author: 'David Kim',
        email: 'david.kim@example.com',
        postId: posts[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'This is exactly what I needed for my project. Thank you!',
        author: 'Lisa Wang',
        email: 'lisa.wang@example.com',
        postId: posts[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Very well written and easy to follow. Looking forward to more content like this.',
        author: 'Alex Johnson',
        email: 'alex.johnson@example.com',
        postId: posts[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${extraComments.length} additional comments`);

  // Display summary
  const summary = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.category.count(),
  ]);

  console.log('\n📊 Database seeding completed successfully!');
  console.log(`👥 Users: ${summary[0]}`);
  console.log(`📝 Posts: ${summary[1]} (${posts.filter(p => p.published).length} published, ${posts.filter(p => !p.published).length} drafts)`);
  console.log(`💬 Comments: ${summary[2]}`);
  console.log(`🏷️  Categories: ${summary[3]}`);
  console.log('\n🚀 You can now start the server and explore the API!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });