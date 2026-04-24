/**
 * Replace {{variable}} tokens in template content with actual values.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Build common template variables from entity data.
 */
export function buildClientVariables(client: any, agent?: any): Record<string, string> {
  const vars: Record<string, string> = {};

  if (client) {
    vars.client_name = client.businessName || `${client.firstName} ${client.lastName}`;
    vars.first_name = client.firstName;
    vars.last_name = client.lastName;
    vars.email = client.email || '';
    vars.phone = client.phone || '';
    vars.city = client.city || '';
    vars.state = client.state || '';
  }

  if (agent) {
    vars.agent_name = agent.name || '';
    vars.agent_email = agent.email || '';
    vars.agent_phone = agent.phone || '';
  }

  return vars;
}

export function buildPolicyVariables(policy: any): Record<string, string> {
  return {
    policy_number: policy.policyNumber || '',
    policy_type: (policy.lineOfBusiness || '').replace(/_/g, ' '),
    premium: `$${Number(policy.premium || 0).toLocaleString()}`,
    effective_date: policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : '',
    expiration_date: policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : '',
    renewal_date: policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : '',
  };
}

export function buildClaimVariables(claim: any): Record<string, string> {
  return {
    claim_number: claim.claimNumber || '',
    claim_type: claim.type || '',
    loss_date: claim.dateOfLoss ? new Date(claim.dateOfLoss).toLocaleDateString() : '',
    estimated_loss: `$${Number(claim.estimatedLoss || 0).toLocaleString()}`,
    adjuster_name: claim.adjusterName || 'Your Claims Team',
  };
}
