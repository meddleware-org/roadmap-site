// Lighthouse CI on the built site: accessibility 100, best practices ≥ 0.95, script and stylesheet budgets (free, results to
// test-results/lighthouse). The page reads its data from same-origin routes that do not exist under `vite preview`, so it audits the
// page's error state, which is still a complete page (header, heading, notice, footer). (.cjs because Lighthouse CI loads its
// config with `require`; Node loads the ES module factory through it.)
const { lighthouseConfig } = require('@meddleware/frontend-config/lighthouserc')

module.exports = lighthouseConfig({ port: 4297 })
