/**
 * create-users.js
 *
 * Node.js script to bulk-create Firebase Auth users and create Firestore users/{uid} docs.
 * Usage: node create-users.js <penilai.csv> <serviceAccount.json> [output.csv]
 *
 * penilai.csv format (header):
 * username,name,division,password,role,angkatan
 *
 * NOTE:
 * - This script must be run locally where you store your Firebase service account JSON.
 * - Do NOT commit or share your serviceAccount.json publicly.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const admin = require('firebase-admin');

async function main() {
  const [, , csvPath, serviceAccountPath, outPath] = process.argv;
  if (!csvPath || !serviceAccountPath) {
    console.error('Usage: node create-users.js <penilai.csv> <serviceAccount.json> [output.csv]');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath); process.exit(1);
  }
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Service account JSON not found:', serviceAccountPath); process.exit(1);
  }

  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const auth = admin.auth();
  const db = admin.firestore();

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true });

  const results = [];
  for (const row of records) {
    const username = row.username.trim();
    const name = row.name.trim();
    const password = row.password || ('Pass' + Math.random().toString(36).slice(2,10));
    const division = row.division ? row.division.trim() : '';
    const role = row.role ? row.role.trim() : 'mpk';
    const angkatan = row.angkatan ? Number(row.angkatan) : 27;

    // Synthetic email (local domain). Not a real mailbox.
    const email = `${username}@mpk71.local`;

    try {
      // create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        emailVerified: false,
        password,
        displayName: name
      });

      // create Firestore users/{uid}
      await db.collection('users').doc(userRecord.uid).set({
        username,
        name,
        division,
        role,
        angkatan,
        email
      });

      console.log(`Created: ${username} -> uid=${userRecord.uid}`);
      results.push({ uid: userRecord.uid, username, email, password, name, division, role, angkatan });
    } catch (err) {
      console.error(`Failed create ${username}:`, err.message);
      results.push({ uid: '', username, email, password, name, division, role, angkatan, error: err.message });
    }
  }

  const output = (outPath || 'users-created.csv');
  const header = ['uid','username','email','password','name','division','role','angkatan','error'];
  const lines = [header.join(',')];
  for (const r of results) {
    lines.push([r.uid, r.username, r.email, r.password, `"${r.name.replace(/"/g,'""')}"`, r.division, r.role, r.angkatan, r.error || ''].join(','));
  }
  fs.writeFileSync(output, lines.join('\n'), 'utf8');
  console.log('Done. Output written to', output);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
