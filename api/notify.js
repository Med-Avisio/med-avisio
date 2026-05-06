export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name, email, termin } = req.body;

  console.log("Neue Buchung:");
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Termin:", termin);

  return res.status(200).json({ success: true });
}
