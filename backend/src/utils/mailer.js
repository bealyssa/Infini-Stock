const nodemailer = require('nodemailer')

function requireEnv(name) {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Missing required env var: ${name}`)
    }
    return value
}

function createTransport() {
    const user = requireEnv('MAIL_USER')
    const pass = requireEnv('MAIL_PASS')

    // Gmail SMTP via App Password is the simplest stable approach.
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass,
        },
    })
}

function getFromAddress() {
    const from = process.env.MAIL_FROM || process.env.MAIL_USER
    if (!from) return undefined
    return from
}

async function sendVerificationEmail({ to, fullName, verifyUrl }) {
    const transporter = createTransport()
    const from = getFromAddress()

    const subject = 'Verify your Infini-Stock account (expires in 5 minutes)'

    const greeting = fullName ? `Hi ${fullName},` : 'Hi,'

    const text = [
        greeting,
        '',
        'An admin created an Infini-Stock account for you.',
        'To activate your account, verify your email using this link (expires in 5 minutes):',
        verifyUrl,
        '',
        'If you did not expect this, you can ignore this email.',
    ].join('\n')

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>${greeting}</p>
            <p>An admin created an Infini-Stock account for you.</p>
            <p><strong>To activate your account</strong>, click the link below (expires in 5 minutes):</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
            <p>If you did not expect this, you can ignore this email.</p>
        </div>
    `.trim()

    await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
    })
}

module.exports = {
    sendVerificationEmail,
}
