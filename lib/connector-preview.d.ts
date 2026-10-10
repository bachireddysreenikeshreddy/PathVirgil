declare module "virtual:harbor-connector-preview" {
  const binding: import("./connector-contract.mjs").ConnectorBinding;
  export default binding;
}

// Only the local preview uses an environment binding. Deployed workers receive the
// request-scoped capability through ctx.props.CONNECTORS in harbor-worker.ts.
declare namespace Cloudflare {
  interface Env {
    CONNECTORS?: import("./connector-contract.mjs").ConnectorBinding;
  }
}
