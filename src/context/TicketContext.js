import React, { createContext, useState, useContext } from 'react';

const TicketContext = createContext({});

const INITIAL_TICKETS = [
  {
    id: 't1',
    ticketNo: 'TKT-20260915-0001',
    clientName: 'ABC Corporation',
    clientContact: '09171234567',
    clientAddress: '123 Rizal St., Makati City',
    channel: 'Support Hotline',
    concernType: 'Hardware Issue',
    concern: 'Printer not working, paper jam error keeps appearing even after clearing.',
    productModel: 'HP LaserJet Pro M404n',
    serialNo: 'PHBBJ12345',
    status: 'PENDING_ACCOUNTING',
    createdByName: 'Maria Santos',
    createdAt: new Date('2026-09-15T08:00:00'),
    updatedAt: new Date('2026-09-15T08:00:00'),
    assignedFSE: null,
    assignedFSEName: null,
    scheduledDate: null,
    history: [
      { status: 'OPEN', note: 'Ticket created by Support', by: 'Maria Santos', at: '2026-09-15T08:00:00' }
    ],
  },
  {
    id: 't2',
    ticketNo: 'TKT-20260915-0002',
    clientName: 'XYZ Trading',
    clientContact: '09281234567',
    clientAddress: '456 Mabini Ave., Quezon City',
    channel: 'SMS/PMS',
    concernType: 'Network Problem',
    concern: 'Cannot connect to network, all workstations are offline since this morning.',
    productModel: 'Cisco Router RV340',
    serialNo: 'CSC98765',
    status: 'IN_ASSESSMENT',
    createdByName: 'Maria Santos',
    createdAt: new Date('2026-09-14T10:30:00'),
    updatedAt: new Date('2026-09-14T14:00:00'),
    assignedFSE: null,
    assignedFSEName: null,
    scheduledDate: null,
    history: [
      { status: 'OPEN', note: 'Ticket created by Support', by: 'Maria Santos', at: '2026-09-14T10:30:00' },
      { status: 'PENDING_ACCOUNTING', note: 'Forwarded for accounting approval', by: 'Maria Santos', at: '2026-09-14T11:00:00' },
      { status: 'IN_ASSESSMENT', note: 'Approved by Branch Manager - forwarded for Technical Assessment', by: 'Jose Reyes', at: '2026-09-14T14:00:00' },
    ],
  },
  {
    id: 't3',
    ticketNo: 'TKT-20260914-0003',
    clientName: 'DEF Enterprises',
    clientContact: '09391234567',
    clientAddress: '789 Luna Blvd., Pasig City',
    channel: 'AE/Sales',
    concernType: 'Software Issue',
    concern: 'POS system crashes every time a transaction is processed.',
    productModel: 'POS Terminal V2',
    serialNo: 'POS11223',
    status: 'ASSIGNED_FSE',
    createdByName: 'Maria Santos',
    createdAt: new Date('2026-09-13T09:00:00'),
    updatedAt: new Date('2026-09-14T09:00:00'),
    assignedFSE: '3',
    assignedFSEName: 'Juan dela Cruz',
    scheduledDate: 'September 16, 2026',
    history: [
      { status: 'OPEN', note: 'Ticket created by Support', by: 'Maria Santos', at: '2026-09-13T09:00:00' },
      { status: 'PENDING_ACCOUNTING', note: 'Forwarded for accounting approval', by: 'Maria Santos', at: '2026-09-13T09:30:00' },
      { status: 'IN_ASSESSMENT', note: 'Approved by Branch Manager', by: 'Jose Reyes', at: '2026-09-13T11:00:00' },
      { status: 'ESCALATED', note: 'Escalated for Onsite Service', by: 'Jose Reyes', at: '2026-09-13T14:00:00' },
      { status: 'ASSIGNED_FSE', note: 'Assigned to FSE: Juan dela Cruz | Scheduled: September 16, 2026', by: 'Jose Reyes', at: '2026-09-14T09:00:00' },
    ],
  },
  {
    id: 't4',
    ticketNo: 'TKT-20260913-0004',
    clientName: 'GHI Company',
    clientContact: '09501234567',
    clientAddress: '321 Burgos St., Mandaluyong',
    channel: 'Support Hotline',
    concernType: 'Maintenance',
    concern: 'Requesting for preventive maintenance of all office equipment.',
    productModel: 'Various',
    serialNo: 'N/A',
    status: 'CLOSED',
    createdByName: 'Maria Santos',
    createdAt: new Date('2026-09-10T08:00:00'),
    updatedAt: new Date('2026-09-13T16:00:00'),
    assignedFSE: '3',
    assignedFSEName: 'Juan dela Cruz',
    scheduledDate: 'September 13, 2026',
    closedBy: 'Juan dela Cruz',
    serviceFindings: 'All equipment cleaned and checked. Replaced toner on 2 printers. Network cables re-terminated.',
    history: [
      { status: 'OPEN', note: 'Ticket created', by: 'Maria Santos', at: '2026-09-10T08:00:00' },
      { status: 'ASSIGNED_FSE', note: 'Assigned to Juan dela Cruz', by: 'Jose Reyes', at: '2026-09-11T09:00:00' },
      { status: 'ONSITE', note: 'FSE Juan dela Cruz started onsite service', by: 'Juan dela Cruz', at: '2026-09-13T09:00:00' },
      { status: 'CLOSED', note: 'Service completed. All equipment maintained.', by: 'Juan dela Cruz', at: '2026-09-13T16:00:00' },
    ],
  },
];

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);

  const addTicket = (ticketData) => {
    const newTicket = {
      id: `t${Date.now()}`,
      ...ticketData,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [
        { status: 'OPEN', note: 'Ticket created by Support', by: ticketData.createdByName, at: new Date().toISOString() }
      ],
    };
    setTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  const updateTicket = (ticketId, updates, historyEntry) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        ...updates,
        updatedAt: new Date(),
        history: [...(t.history || []), historyEntry],
      };
    }));
  };

  const getTicket = (ticketId) => tickets.find(t => t.id === ticketId);

  const getTicketsByFSE = (fseUid) => tickets.filter(t => t.assignedFSE === fseUid);

  return (
    <TicketContext.Provider value={{ tickets, addTicket, updateTicket, getTicket, getTicketsByFSE }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => useContext(TicketContext);
