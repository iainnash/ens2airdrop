const query = `
query resolves($names: [String!]){
  domains(where:{
    name_in: $names
  }) {
    name
    resolvedAddress {
      id
    }
  }
}
`;

export async function ensGraphFetch(domains: string[]) {
  const resp = await fetch(
    "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
    {
      method: "POST",
      body: JSON.stringify({
        query,
        variables: { names: domains },
        operationName: "resolves",
      }),
      headers: { "content-type": "application/json" },
    }
  );
  const json = await resp.json();
  return json.data.domains
    .filter((domain) => domain.resolvedAddress && domain.name)
    .map((domain) => ({
      addr: domain.resolvedAddress.id,
      ens: domain.name,
    }));
}
