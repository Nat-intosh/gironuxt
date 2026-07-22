import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  // On récupère le payload parfait que tu as construit côté front
  const body = await readBody(event)

  // On configure l'accès à Gmail (Côté serveur, donc 100% sécurisé)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'no-reply@le-girofard.org',
      // Remets ici ton mot de passe d'application Gmail
      pass: process.env.GMAIL_APP_KEY, 
    }
  })

  try {
    // On force l'envoi avec TES paramètres dynamiques (to, bcc, etc.)
    await transporter.sendMail({
      from: '"Le Girofard" <contact@le-girofard.org>',
      to: body.to,
      bcc: body.bcc,
      replyTo: body.replyTo,
      subject: body.subject,
      text: body.text,
      attachments: body.attachments
    })

    return { success: true }
    
  } catch (error) {
    console.error("Erreur SMTP :", error)
    throw createError({
      statusCode: 500,
      message: "Impossible d'envoyer l'email."
    })
  }
})
