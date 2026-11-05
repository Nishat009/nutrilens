// Access-control matrix: walks every Express router and checks that each route carries the guards the
// project conventions require (CLAUDE.md). Runs without MongoDB. Usage: npm run test:unit
const assert = require('node:assert/strict');
const path = require('path');

const ROUTERS = {
  auth: 'auth.routes', users: 'user.routes', meals: 'meal.routes', foods: 'food.routes',
  vegetables: 'vegetable.routes', scans: 'scan.routes', progress: 'progress.routes',
  diets: 'diet.routes', planner: 'planner.routes', admin: 'admin.routes',
};

// Routes that are intentionally public. Everything else needs requireAuth.
const PUBLIC = new Set([
  'POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/demo-login',
  'GET /api/foods/', 'GET /api/foods/:id',
  'GET /api/vegetables/search', 'GET /api/vegetables/categories', 'GET /api/vegetables/', 'GET /api/vegetables/:idOrSlug',
  'GET /api/diets/', 'GET /api/diets/:slug',
]);
const MUTATING = new Set(['post', 'put', 'patch', 'delete']);

// Lists each route with the names of every middleware that runs before its handler.
function routesOf(mount, router) {
  const routes = [];
  const routerLevel = [];
  for (const layer of router.stack) {
    if (!layer.route) {
      routerLevel.push(layer.name);
      continue;
    }
    for (const method of Object.keys(layer.route.methods)) {
      const chain = [...routerLevel, ...layer.route.stack.map((item) => item.name)];
      routes.push({ method, key: `${method.toUpperCase()} /api/${mount}${layer.route.path}`, chain });
    }
  }
  return routes;
}

const all = Object.entries(ROUTERS).flatMap(([mount, file]) =>
  routesOf(mount, require(path.join(__dirname, '..', 'src', 'routes', file))));
let checks = 0;
const expectGuard = (route, guard) => {
  checks += 1;
  assert.ok(route.chain.includes(guard), `${route.key} is missing ${guard} (chain: ${route.chain.join(' > ')})`);
};

for (const route of all) {
  if (PUBLIC.has(route.key)) {
    checks += 1;
    assert.ok(!MUTATING.has(route.method) || route.key.startsWith('POST /api/auth/'), `${route.key} is public but mutates data`);
    continue;
  }
  expectGuard(route, 'requireAuth');
  if (route.key.startsWith('GET /api/admin/') || route.key.includes(' /api/admin/')) expectGuard(route, 'requireAdmin');
  if (route.key.includes(' /api/admin/') && MUTATING.has(route.method)) expectGuard(route, 'blockDemoWrites');
  if (route.key === 'POST /api/foods/') {
    expectGuard(route, 'requireAdmin');
    expectGuard(route, 'blockDemoWrites');
  }
  if (route.key.includes(' /api/users/:id')) expectGuard(route, 'requireSelf');
  // Guards always run before the handler, which is the last entry of the chain.
  checks += 1;
  assert.ok(route.chain.indexOf('requireAuth') < route.chain.length - 1, `${route.key}: requireAuth must precede the handler`);
}

// Every public route listed above must still exist, so the allow-list cannot drift silently.
for (const key of PUBLIC) {
  checks += 1;
  assert.ok(all.some((route) => route.key === key), `public route ${key} no longer exists; update the test`);
}

console.log(`Route guards: ${all.length} routes, ${checks} checks passed.`);
for (const route of all) {
  console.log(`  ${route.key.padEnd(44)} ${PUBLIC.has(route.key) ? 'public' : route.chain.slice(0, -1).join(' > ')}`);
}
