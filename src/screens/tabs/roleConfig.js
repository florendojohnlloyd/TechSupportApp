// Per-role configuration for the tabbed UI.
// Keeps Home/Tickets/Notifications wiring consistent across Support, BM, FSE.

export const getRoleConfig = (role, colors) => {
  switch (role) {
    case 'support':
      return {
        title: 'Support Desk',
        portal: 'Support Portal',
        accent: colors.support,
        gradient: colors.gradientHeader,
        detailRoute: 'TicketDetail',
        canCreate: true,
        // which tickets this role sees
        scope: 'all',
        quickActions: [
          { key: 'create', label: 'Create Ticket', sub: 'Report a problem or request', icon: 'add-circle', route: 'CreateTicket' },
          { key: 'tickets', label: 'My Tickets', sub: 'View existing tickets', icon: 'reader', tab: 'Tickets' },
          { key: 'help', label: 'Tech Support', sub: 'Get help with common issues', icon: 'help-buoy', tab: 'Notifications' },
          { key: 'profile', label: 'Profile', sub: 'Manage your account', icon: 'person-circle', tab: 'Profile' },
        ],
        statusFilters: ['ALL', 'PENDING_ACCOUNTING', 'IN_ASSESSMENT', 'ESCALATED', 'ASSIGNED_FSE', 'CLOSED'],
      };
    case 'branch_manager':
      return {
        title: 'Branch Manager',
        portal: 'Manager Portal',
        accent: colors.manager,
        gradient: [colors.manager, '#5B21B6'],
        detailRoute: 'BMTicketDetail',
        canCreate: false,
        scope: 'all',
        quickActions: [
          { key: 'tickets', label: 'All Tickets', sub: 'Review & approve tickets', icon: 'reader', tab: 'Tickets' },
          { key: 'pending', label: 'For Approval', sub: 'Pending accounting approval', icon: 'hourglass', tab: 'Tickets' },
          { key: 'notif', label: 'Notifications', sub: 'Updates & activity', icon: 'notifications', tab: 'Notifications' },
          { key: 'profile', label: 'Profile', sub: 'Manage your account', icon: 'person-circle', tab: 'Profile' },
        ],
        statusFilters: ['ALL', 'PENDING_ACCOUNTING', 'IN_ASSESSMENT', 'ESCALATED', 'ASSIGNED_FSE', 'ONSITE', 'CLOSED'],
      };
    case 'fse':
    default:
      return {
        title: 'Field Engineer',
        portal: 'Field Portal',
        accent: colors.fse,
        gradient: [colors.fse, '#047857'],
        detailRoute: 'FSETicketDetail',
        canCreate: false,
        scope: 'mine',
        quickActions: [
          { key: 'tickets', label: 'My Jobs', sub: 'Assigned service tickets', icon: 'construct', tab: 'Tickets' },
          { key: 'onsite', label: 'Onsite', sub: 'Active onsite service', icon: 'car', tab: 'Tickets' },
          { key: 'notif', label: 'Notifications', sub: 'Updates & schedule', icon: 'notifications', tab: 'Notifications' },
          { key: 'profile', label: 'Profile', sub: 'Manage your account', icon: 'person-circle', tab: 'Profile' },
        ],
        statusFilters: ['ALL', 'ASSIGNED_FSE', 'ONSITE', 'SERVICE_PENDING', 'CLOSED'],
      };
  }
};
