// Demo mode: lets visitors of a public showcase deployment sign in with one click.
// Off unless DEMO_MODE=true. Demo accounts are created by `npm run seed`.
const DEMO_ACCOUNTS = {
  user: { name: 'Alex Morgan', email: 'alex.morgan@nutrilens.ai' },
  admin: { name: 'Demo Admin', email: 'admin@nutrilens.ai' },
};

const isDemoMode = () => process.env.DEMO_MODE === 'true';

module.exports = { DEMO_ACCOUNTS, isDemoMode };
