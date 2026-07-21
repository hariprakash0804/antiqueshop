const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const sequelize = require('../config/db');
const { User, Product, Review, Wishlist, Coupon, Setting } = require('../models');

const seedDatabase = async () => {
  try {
    // 1. Proactively create database if it doesn't exist
    console.log('Verifying MySQL database for seeding...');
    const connectionOptions = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    };
    
    if (
      process.env.DB_SSL === 'true' || 
      (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com')) || 
      process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined
    ) {
      connectionOptions.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
      };
    }

    try {
      const connection = await mysql.createConnection(connectionOptions);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
      await connection.end();
      console.log(`Database '${process.env.DB_NAME}' verified.`);
    } catch (dbError) {
      console.warn(`[DATABASE WARNING] Could not verify/create database automatically: ${dbError.message}. Relying on existing schema connection.`);
    }

    // Sync database (force sync deletes all current records)
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create default accounts with encrypted passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const admin = await User.create({
      name: 'Alpha Admin',
      email: 'admin@antique.com',
      password: hashedPassword,
      role: 'admin'
    });

    const seller = await User.create({
      name: 'Vanguard Seller',
      email: 'seller@antique.com',
      password: hashedPassword,
      role: 'seller'
    });

    const manager = await User.create({
      name: 'Nexus Order Manager',
      email: 'manager@antique.com',
      password: hashedPassword,
      role: 'order_manager'
    });

    const customer = await User.create({
      name: 'Cyber Customer',
      email: 'customer@antique.com',
      password: hashedPassword,
      role: 'customer',
      phone: '+91 9876543210',
      address: '77 Nebula Tower, Cybercity Sector 9, Mumbai, Maharashtra, 400001'
    });

    console.log('Default accounts seeded successfully:');
    console.log('- Admin: admin@antique.com / password123');
    console.log('- Seller: seller@antique.com / password123');
    console.log('- Manager: manager@antique.com / password123');
    console.log('- Customer: customer@antique.com / password123');

    // Seed products (all mapped to the seller user)
    const seededProducts = await Product.bulkCreate([
      {
        title: 'Astral Chronometer Pocket Watch',
        description: 'An elegant 19th-century Swiss-made pocket watch featuring an engraved brass casing. Retrofitted with futuristic neon-cyan hand movements that sync with stellar cycles.',
        price: 45000.00,
        imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop',
        category: 'Watches',
        stock: 5,
        sellerId: seller.id,
        specifications: JSON.stringify({ spec1: 'Swiss Lever Escapement', spec2: 'Circa 1888' })
      },
      {
        title: 'Victorian Royal Emerald Ring',
        description: 'A premium 18-karat gold ring from the late Victorian era. Embellished with a brilliant 2.4-carat emerald surrounded by fine diamonds, glowing under holographic light filters.',
        price: 125000.00,
        imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop',
        category: 'Jewelry',
        stock: 2,
        sellerId: seller.id,
        specifications: JSON.stringify({ spec1: '18k Yellow Gold', spec2: '2.4ct Emerald' })
      },
      {
        title: 'Imperial Roman Bronze Bust',
        description: 'An authentic excavation piece dating back to the 2nd century AD, depicting a noble philosopher. Displayed on an electromagnetic levitation pedestal for absolute preservation.',
        price: 290000.00,
        imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=600&auto=format&fit=crop',
        category: 'Antiques',
        stock: 1,
        sellerId: seller.id,
        specifications: JSON.stringify({ spec1: 'Ancient Roman Bust', spec2: 'Excavated in Pompeii' })
      },
      {
        title: 'Gilded Cyber-Nefertiti Pendant',
        description: 'A hand-forged 22-karat yellow gold pendant capturing the iconic silhouette of Nefertiti. Built with embedded glowing micro-circuit design lines that capture the light.',
        price: 82000.00,
        imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
        category: 'Jewelry',
        stock: 8,
        sellerId: seller.id,
        specifications: JSON.stringify({ spec1: '22k Yellow Gold', spec2: 'Flawless Egyptian Lapis' })
      },
      {
        title: '1882 Gold Double Eagle Coin',
        description: 'A highly preserved Liberty Head Double Eagle coin graded MS-63. Stored in a custom carbon-fiber slab with a digital ledger certificate of authenticity.',
        price: 195000.00,
        imageUrl: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?q=80&w=600&auto=format&fit=crop',
        category: 'Coins',
        stock: 3,
        sellerId: seller.id,
        specifications: JSON.stringify({ spec1: 'MS-63 Certified graded', spec2: '90% Gold, 10% Copper' })
      }
    ]);

    console.log('Test products seeded successfully.');

    // Seed reviews
    const watch = seededProducts.find(p => p.title === 'Astral Chronometer Pocket Watch');
    const ring = seededProducts.find(p => p.title === 'Victorian Royal Emerald Ring');

    await Review.bulkCreate([
      {
        userId: customer.id,
        productId: watch.id,
        rating: 5,
        comment: 'Absolutely stunning watch. The cosmic neon hands make it look truly celestial and futuristic. Engravings are pristine.'
      },
      {
        userId: customer.id,
        productId: ring.id,
        rating: 4,
        comment: 'Beautiful emerald clarity and setting. Truly royal, looks majestic on my holodisplay.'
      }
    ]);
    console.log('Test reviews seeded.');

    // Seed wishlist
    await Wishlist.create({
      userId: customer.id,
      productId: watch.id
    });
    console.log('Test wishlist seeded.');

    // Seed default coupons
    await Coupon.bulkCreate([
      { code: 'NEXUS20', discount: 20 },
      { code: 'ANCIENT10', discount: 10 }
    ]);
    console.log('Default coupons seeded.');

    // Seed default settings
    await Setting.create({ key: 'tax_rate', value: '18' });
    console.log('Default settings seeded (tax_rate: 18%).');

    process.exit(0);
  } catch (error) {
    console.error('Seeding database error:', error);
    process.exit(1);
  }
};

seedDatabase();
