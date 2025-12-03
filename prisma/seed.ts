import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Administrador',
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Usuário Comum',
      role: Role.CLIENT,
    },
  });

  const tech = await prisma.category.upsert({
    where: { slug: 'tecnologia' },
    update: {},
    create: {
      name: 'Tecnologia',
      slug: 'tecnologia',
      description: 'Artigos sobre tecnologia e programação',
    },
  });

  const lifestyle = await prisma.category.upsert({
    where: { slug: 'estilo-de-vida' },
    update: {},
    create: {
      name: 'Estilo de Vida',
      slug: 'estilo-de-vida',
      description: 'Dicas de estilo de vida e bem-estar',
    },
  });

  const post1 = await prisma.post.upsert({
    where: { slug: 'introducao-ao-nestjs-' + Date.now() },
    update: {},
    create: {
      title: 'Introdução ao NestJS',
      slug: 'introducao-ao-nestjs-' + Date.now(),
      content: 'NestJS é um framework progressivo para Node.js que utiliza TypeScript e é inspirado no Angular. Neste artigo, vamos explorar os conceitos básicos e aprender como criar aplicações escaláveis e eficientes.',
      published: true,
      authorId: admin.id,
      categoryId: tech.id,
    },
  });

  const post2 = await prisma.post.upsert({
    where: { slug: 'prisma-orm-guia-completo-' + (Date.now() + 1) },
    update: {},
    create: {
      title: 'Prisma ORM: Guia Completo',
      slug: 'prisma-orm-guia-completo-' + (Date.now() + 1),
      content: 'Prisma é um ORM moderno que facilita o trabalho com bancos de dados. Aprenda como configurar, criar migrations e realizar queries complexas de forma simples e type-safe.',
      published: true,
      authorId: user.id,
      categoryId: tech.id,
    },
  });

  const post3 = await prisma.post.upsert({
    where: { slug: 'dicas-produtividade-' + (Date.now() + 2) },
    update: {},
    create: {
      title: 'Dicas de Produtividade para Desenvolvedores',
      slug: 'dicas-produtividade-' + (Date.now() + 2),
      content: 'Ser produtivo não é apenas trabalhar mais, mas trabalhar de forma mais inteligente. Veja algumas dicas práticas para aumentar sua produtividade no dia a dia.',
      published: false,
      authorId: admin.id,
      categoryId: lifestyle.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Excelente artigo! Muito bem explicado.',
      postId: post1.id,
      authorId: user.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Obrigado pelo conteúdo! Estava procurando isso.',
      postId: post2.id,
      authorId: admin.id,
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('\n📧 Credenciais de teste:');
  console.log('Admin: admin@example.com / admin123');
  console.log('User: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
