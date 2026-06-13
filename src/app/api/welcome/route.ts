import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { name, email, plan } = await request.json()

  const planName = plan === 'elite' ? 'Elite' : 'Pace'
  const planPrice = plan === 'elite' ? 'RD$2,400/mes' : 'RD$1,500/mes'

  const { data, error } = await resend.emails.send({
    from: 'Santiago Running Club <hola@santiagorunningclub.com>',
    to: email,
    subject: `¡Bienvenido al Santiago Running Club, ${name.split(' ')[0]}! 🏃`,
    html: `
      <div style="font-family: Inter, sans-serif; background: #0a0a0a; color: #fff; max-width: 560px; margin: 0 auto; padding: 40px 32px; border-radius: 16px;">
        <div style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">
          Santiago<em style="font-style: italic; font-weight: 400;">Running</em>Club®
        </div>
        <div style="height: 2px; background: linear-gradient(90deg, #4ade80, #22d3ee); margin-bottom: 32px; border-radius: 999px;"></div>
        
        <div style="font-size: 28px; font-weight: 600; margin-bottom: 12px;">
          ¡Bienvenido, ${name.split(' ')[0]}! 🎉
        </div>
        
        <p style="font-size: 15px; color: rgba(255,255,255,0.6); line-height: 1.7; margin-bottom: 24px;">
          Tu solicitud de membresía <strong style="color: #fff;">Plan ${planName}</strong> (${planPrice}) fue recibida. 
          Un administrador revisará tu registro y activará tu cuenta en las próximas 24 horas.
        </p>

        <div style="background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 12px; text-transform: uppercase; letter-spacing: .08em;">Tu membresía incluye</div>
          ${plan === 'elite' ? `
            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">✓ Corridas grupales · Sábados 6AM</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">✓ Track day exclusivo · Jueves 6:30AM</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">✓ Canal Elite privado</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">✓ Descuentos exclusivos con patrocinadores</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.6);">✓ Dashboard y ranking personal</div>
          ` : `
            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">✓ Corridas grupales · Sábados 6AM</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">✓ Acceso al chat y foro del club</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">✓ Galería y directorio de corredores</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.6);">✓ Dashboard y ranking personal</div>
          `}
        </div>

        <a href="https://santiagorunningclub.com/login" 
           style="display: block; text-align: center; background: #fff; color: #0a0a0a; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 600; text-decoration: none; margin-bottom: 24px;">
          Ir al login cuando te activen →
        </a>

        <p style="font-size: 13px; color: rgba(255,255,255,0.25); line-height: 1.6;">
          ¿Tienes preguntas? Escríbenos a <a href="mailto:hola@santiagorunningclub.com" style="color: #4ade80;">hola@santiagorunningclub.com</a> o por WhatsApp al (809) 475-7867.
        </p>

        <div style="margin-top: 32px; padding-top: 20px; border-top: 0.5px solid rgba(255,255,255,0.07); font-size: 12px; color: rgba(255,255,255,0.2);">
          Santiago Running Club · Santiago, República Dominicana
        </div>
      </div>
    `
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
}