/**
 * Quick script to check and update user role to admin
 * Run: node checkUserRole.js YOUR_EMAIL@example.com
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkAndUpdateRole = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get email from command line argument
        const userEmail = process.argv[2];

        if (!userEmail) {
            console.log('❌ Please provide your email as an argument');
            console.log('Usage: node checkUserRole.js your-email@example.com\n');

            // Show all users with their roles
            console.log('📊 All users in database:');
            const allUsers = await mongoose.connection.db.collection('users')
                .find({})
                .project({ email: 1, username: 1, role: 1, status: 1 })
                .toArray();

            allUsers.forEach(user => {
                console.log(`   - ${user.email || user.username}: ${user.role || 'NO ROLE'} (${user.status || 'NO STATUS'})`);
            });

            process.exit(1);
        }

        // Find the user
        const user = await mongoose.connection.db.collection('users')
            .findOne({ email: userEmail.toLowerCase() });

        if (!user) {
            console.log(`❌ User with email ${userEmail} not found\n`);

            // Show all users
            console.log('📊 Available users:');
            const allUsers = await mongoose.connection.db.collection('users')
                .find({})
                .project({ email: 1, username: 1, role: 1 })
                .toArray();

            allUsers.forEach(u => {
                console.log(`   - ${u.email || u.username}: ${u.role || 'NO ROLE'}`);
            });

            process.exit(1);
        }

        // Show current user role
        console.log(`📧 User: ${user.email}`);
        console.log(`👤 Username: ${user.username}`);
        console.log(`🎭 Current Role: ${user.role || 'NO ROLE'}`);
        console.log(`📊 Status: ${user.status || 'NO STATUS'}\n`);

        // Update to admin if not already
        if (user.role !== 'admin') {
            const result = await mongoose.connection.db.collection('users')
                .updateOne(
                    { email: userEmail.toLowerCase() },
                    {
                        $set: {
                            role: 'admin',
                            status: 'available'
                        }
                    }
                );

            if (result.modifiedCount > 0) {
                console.log(`✅ Successfully updated ${userEmail} to admin role!\n`);
            }
        } else {
            console.log(`✅ User already has admin role!\n`);
        }

        console.log('✅ Done! You can now send team invites.\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkAndUpdateRole();
