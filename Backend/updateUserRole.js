/**
 * Migration Script: Add role field to existing users
 * Run this once to update all existing users without a role field
 * 
 * Usage: node updateUserRole.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

const updateUsers = async () => {
    try {
        // Update all users without a role field to have default 'developer' role
        const result = await mongoose.connection.db.collection('users').updateMany(
            { role: { $exists: false } }, // Find users without role field
            {
                $set: {
                    role: 'developer',
                    status: 'available' // Also add status if missing
                }
            }
        );

        console.log(`\n✅ Updated ${result.modifiedCount} user(s) with default role and status`);

        // Now, let's update YOUR specific user to admin
        console.log('\n📝 Please enter your email to set as admin:');
        console.log('   (Or press Ctrl+C to skip this step)\n');

        // Get user email from command line argument
        const userEmail = process.argv[2];

        if (userEmail) {
            const adminUpdate = await mongoose.connection.db.collection('users').updateOne(
                { email: userEmail.toLowerCase() },
                {
                    $set: {
                        role: 'admin',
                        status: 'available'
                    }
                }
            );

            if (adminUpdate.modifiedCount > 0) {
                console.log(`✅ Successfully updated ${userEmail} to admin role!`);
            } else if (adminUpdate.matchedCount > 0) {
                console.log(`✅ User ${userEmail} already has admin role!`);
            } else {
                console.log(`❌ User with email ${userEmail} not found.`);
            }
        } else {
            console.log('ℹ️  No email provided. To set a user as admin, run:');
            console.log('   node updateUserRole.js your-email@example.com');
        }

        // Display all users with their roles
        console.log('\n📊 Current users and their roles:');
        const users = await mongoose.connection.db.collection('users')
            .find({})
            .project({ email: 1, username: 1, role: 1, status: 1 })
            .toArray();

        users.forEach(user => {
            console.log(`   - ${user.email || user.username}: ${user.role || 'NO ROLE'} (${user.status || 'NO STATUS'})`);
        });

        console.log('\n✅ Migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating users:', error);
        process.exit(1);
    }
};

// Run the migration
updateUsers();
