/**
 * Token Validation Test Script
 * This script helps diagnose token validation issues
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkTokens() {
    try {
        // Dynamic import of models
        const { User } = await import('./src/models/userModel.js');
        const { Invitation } = await import('./src/models/invitationModel.js');


        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('🔍 Checking invitation tokens in database...\n');

        // Find all pending invitations
        const pendingInvitations = await Invitation.find({ status: 'pending' })
            .populate('invitedBy', 'fullName email');

        console.log(`Found ${pendingInvitations.length} pending invitation(s):\n`);

        for (const invitation of pendingInvitations) {
            const user = await User.findOne({ email: invitation.email });

            const now = new Date();
            const expiresAt = new Date(invitation.expiresAt);
            const isExpired = now > expiresAt;
            const timeRemaining = isExpired ? 'EXPIRED' : Math.round((expiresAt - now) / (1000 * 60 * 60)) + ' hours';

            console.log(`📧 Email: ${invitation.email}`);
            console.log(`   Role: ${invitation.role}`);
            console.log(`   Invited by: ${invitation.invitedBy?.fullName || 'Unknown'}`);
            console.log(`   Created: ${invitation.createdAt}`);
            console.log(`   Expires: ${expiresAt}`);
            console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'} (${timeRemaining})`);

            if (user) {
                const userTokenExpiry = new Date(user.forgotPasswordExpiry);
                const userTokenExpired = now > userTokenExpiry;
                console.log(`   User Token Expiry: ${userTokenExpiry}`);
                console.log(`   User Token Status: ${userTokenExpired ? '❌ EXPIRED' : '✅ VALID'}`);
            }
            console.log('');
        }

        if (pendingInvitations.length === 0) {
            console.log('ℹ️  No pending invitations found.');
            console.log('   Please send a new invitation from the admin panel.\n');
        }

        // Check all inactive users (haven't set password yet)
        const inactiveUsers = await User.find({ status: 'inactive' })
            .select('email fullName status forgotPasswordExpiry createdAt');

        if (inactiveUsers.length > 0) {
            console.log(`\n📋 Found ${inactiveUsers.length} inactive user(s) (pending password setup):\n`);

            for (const user of inactiveUsers) {
                const now = new Date();
                const tokenExpiry = new Date(user.forgotPasswordExpiry);
                const tokenExpired = now > tokenExpiry;

                console.log(`👤 ${user.fullName} (${user.email})`);
                console.log(`   Created: ${user.createdAt}`);
                console.log(`   Token Expires: ${tokenExpiry}`);
                console.log(`   Token Status: ${tokenExpired ? '❌ EXPIRED' : '✅ VALID'}\n`);
            }
        }

        console.log('\n💡 Recommendations:');
        console.log('   1. If tokens are expired, use the "Resend Invitation" button in admin panel');
        console.log('   2. New invitations will now have 24-hour expiry (old ones had 20 minutes)');
        console.log('   3. Make sure to use the token from the LATEST invitation email\n');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the check
checkTokens();
