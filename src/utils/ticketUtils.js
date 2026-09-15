export const TICKET_STATUSES = {
  OPEN: 'OPEN',
  PENDING_ACCOUNTING: 'PENDING_ACCOUNTING',
  ON_HOLD: 'ON_HOLD',
  IN_ASSESSMENT: 'IN_ASSESSMENT',
  ESCALATED: 'ESCALATED',
  PENDING_SCHEDULE: 'PENDING_SCHEDULE',
  ASSIGNED_FSE: 'ASSIGNED_FSE',
  ONSITE: 'ONSITE',
  SERVICE_PENDING: 'SERVICE_PENDING',
  CLOSED: 'CLOSED',
};

export const getStatusLabel = (status) => {
  const labels = {
    OPEN: 'Open',
    PENDING_ACCOUNTING: 'Pending Approval',
    ON_HOLD: 'On Hold',
    IN_ASSESSMENT: 'In Assessment',
    ESCALATED: 'Escalated',
    PENDING_SCHEDULE: 'Pending Schedule',
    ASSIGNED_FSE: 'Assigned to FSE',
    ONSITE: 'Onsite',
    SERVICE_PENDING: 'Pending',
    CLOSED: 'Closed',
  };
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    OPEN: '#2563EB',
    PENDING_ACCOUNTING: '#F59E0B',
    ON_HOLD: '#64748B',
    IN_ASSESSMENT: '#8B5CF6',
    ESCALATED: '#EC4899',
    PENDING_SCHEDULE: '#0891B2',
    ASSIGNED_FSE: '#0EA5E9',
    ONSITE: '#F97316',
    SERVICE_PENDING: '#EF4444',
    CLOSED: '#10B981',
  };
  return colors[status] || '#94A3B8';
};

export const getStatusBg = (status) => {
  const bgs = {
    OPEN: '#DBEAFE',
    PENDING_ACCOUNTING: '#FEF3C7',
    ON_HOLD: '#F1F5F9',
    IN_ASSESSMENT: '#EDE9FE',
    ESCALATED: '#FCE7F3',
    PENDING_SCHEDULE: '#CFFAFE',
    ASSIGNED_FSE: '#E0F2FE',
    ONSITE: '#FFEDD5',
    SERVICE_PENDING: '#FEE2E2',
    CLOSED: '#D1FAE5',
  };
  return bgs[status] || '#F1F5F9';
};
