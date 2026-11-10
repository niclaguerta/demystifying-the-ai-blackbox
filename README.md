# Demystifying the AI Blackbox

The participant form and facilitator results live in the same private Site. D1 stores one row per submission with a timestamp and five answers. The application asks for no name or email. Results are available at /results, with CSV at /results/csv.

The Site starts owner-private. The results page and CSV require the signed-in account configured as FACILITATOR_EMAIL in Sites runtime settings. Participant access is managed separately in Sites sharing settings.

Edit the workshop name and question wording in app/content.ts. The participant page heading is in app/page.tsx. The fonts and colors come from the Lian workshop source. The font files are embedded workshop font subsets and are supplied for this workshop design.

Run npm ci, npm run db:generate when changing the schema, and npm run build. Sites applies the checked-in migrations when it deploys.
