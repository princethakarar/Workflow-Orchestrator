import dotenv from 'dotenv'
import { Resend } from 'resend'

// Load environment variables
dotenv.config()

console.log('\n🔍 Testing Resend Email Configuration...\n')

// Display configuration
console.log('📋 Configuration:')
console.log('  Resend API Key:', process.env.RESEND_API_KEY ? `✅ Set (length: ${process.env.RESEND_API_KEY.length})` : '❌ NOT SET')
console.log('  From:', process.env.MAIL_FROM_ADDRESS || '❌ NOT SET (will default to onboarding@resend.dev)')
console.log('')

if (!process.env.RESEND_API_KEY) {
    console.error('❌ Missing required RESEND_API_KEY in .env file')
    process.exit(1)
}

const resend = new Resend(process.env.RESEND_API_KEY)
const testRecipient = process.env.TEST_EMAIL_TO || process.env.MAIL_FROM_ADDRESS || 'onboarding@resend.dev'

console.log('📨 Sending test email with Resend...')

const run = async () => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.MAIL_FROM_ADDRESS || 'onboarding@resend.dev',
            to: testRecipient,
            subject: 'Test Email from Workflow Orchestrator (Resend)',
            text: 'If you receive this email, Resend configuration is working correctly!',
            html: '<h1>Test Successful</h1><p>If you receive this email, Resend configuration is working correctly!</p>'
        })

        if (error) {
            console.error('❌ Resend returned an error')
            console.error(error)
            process.exit(1)
        }

        console.log('✅ Test email sent successfully!')
        console.log('Response:', data)
        console.log(`\n🎉 Everything is working! Check the inbox of: ${testRecipient}`)
    } catch (error) {
        console.error('❌ Failed to send test email')
        console.error('Error:', error.message)
        process.exit(1)
    }
}

run()
