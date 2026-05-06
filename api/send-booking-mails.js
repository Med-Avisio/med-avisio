import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patientName,
      patientEmail,
      appointmentDate,
      appointmentTime,
      appointmentType,
      phone
    } = req.body;

    if (!patientEmail || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        error: 'Patient email, appointment date and appointment time are required'
      });
    }

    const safePatientName = escapeHtml(patientName || 'Patientin/Patient');
    const safePatientEmail = escapeHtml(patientEmail);
    const safeAppointmentDate = escapeHtml(appointmentDate);
    const safeAppointmentTime = escapeHtml(appointmentTime);
    const safeAppointmentType = escapeHtml(appointmentType || 'Online-Sprechstunde');
    const safePhone = escapeHtml(phone || '-');

    const fromAddress = 'med-avisio <kontakt@med-avisio.com>';

    await resend.emails.send({
      from: fromAddress,
      to: patientEmail,
      subject: 'Ihre Terminreservierung bei med-avisio',
      html: `
        <p>Guten Tag ${safePatientName},</p>

        <p>vielen Dank. Ihre Terminreservierung bei med-avisio ist eingegangen.</p>

        <p>
          <strong>Termin:</strong> ${safeAppointmentDate} um ${safeAppointmentTime}<br>
          <strong>Beratung:</strong> ${safeAppointmentType}
        </p>

        <p>
          Bitte beachten Sie: Die Online-Beratung ersetzt keine akute Notfallbehandlung
          und keine Untersuchung vor Ort, wenn diese medizinisch erforderlich ist.
          Bei akuten oder plötzlich auftretenden Beschwerden wenden Sie sich bitte an
          eine augenärztliche Praxis vor Ort, den ärztlichen Bereitschaftsdienst oder
          im Notfall an den Rettungsdienst.
        </p>

        <p>Freundliche Grüße<br>med-avisio</p>
      `
    });

    await resend.emails.send({
      from: fromAddress,
      to: 'kontakt@med-avisio.com',
      subject: 'Neue Terminreservierung bei med-avisio',
      html: `
        <p><strong>Neue Terminreservierung</strong></p>

        <p>
          <strong>Name:</strong> ${safePatientName}<br>
          <strong>E-Mail:</strong> ${safePatientEmail}<br>
          <strong>Telefon:</strong> ${safePhone}<br>
          <strong>Termin:</strong> ${safeAppointmentDate} um ${safeAppointmentTime}<br>
          <strong>Beratung:</strong> ${safeAppointmentType}
        </p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend mail error:', error);
    return res.status(500).json({ error: 'Could not send booking emails' });
  }
}