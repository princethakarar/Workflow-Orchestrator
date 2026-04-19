import mongoose from 'mongoose'
import dotenv from 'dotenv'
// User import moved to dynamic import

// Load environment variables
dotenv.config()

/**
 * Migration script to add specialization field to existing users
 * Sets default value of 'Full Stack' for all users without a specialization
 */
async function migrateSpecialization() {
    try {
        console.log('🔄 Starting specialization migration...\n')

        // Dynamic import to ensure env vars are loaded first
        const { User } = await import('../src/models/userModel.js')

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables')
        }

        console.log('📝 Mongo URI found:', process.env.MONGO_URI.substring(0, 20) + '...')

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connected to MongoDB\n')

        // Count users without specialization
        const usersWithoutSpec = await User.countDocuments({
            specialization: { $exists: false }
        })
        console.log(`📊 Found ${usersWithoutSpec} users without specialization field\n`)

        if (usersWithoutSpec === 0) {
            console.log('✨ All users already have specialization field. No migration needed.')
            await mongoose.connection.close()
            process.exit(0)
        }

        // Update all users without specialization
        const result = await User.updateMany(
            { specialization: { $exists: false } },
            { $set: { specialization: 'Full Stack' } }
        )

        console.log(`✅ Migration completed successfully!`)
        console.log(`📈 Updated ${result.modifiedCount} users with default specialization: 'Full Stack'\n`)

        // Verify migration
        const remainingUsers = await User.countDocuments({
            specialization: { $exists: false }
        })

        if (remainingUsers === 0) {
            console.log('✅ Verification: All users now have specialization field')
        } else {
            console.log(`⚠️  Warning: ${remainingUsers} users still missing specialization`)
        }

        // Close connection
        await mongoose.connection.close()
        console.log('\n🔌 Database connection closed')
        process.exit(0)

    } catch (error) {
        console.error('❌ Migration failed:', error.message)
        console.error(error)

        // Close connection on error
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close()
        }

        process.exit(1)
    }
}

// Run migration
migrateSpecialization()
