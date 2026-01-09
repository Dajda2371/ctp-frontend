export interface Site {
    id: string;
    name: string;
    address: string;
    coordinator: string;
}

export interface Task {
    id: string;
    siteId: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assignee: string;
    photos: string[];
    createdAt: string;
}

export const MOCK_SITES: Site[] = [
    {
        id: '1',
        name: 'CTPark Prague North',
        address: 'Prague North, Czech Republic',
        coordinator: 'Karel Novak',
    },
    {
        id: '2',
        name: 'CTPark Ostrava',
        address: 'Ostrava, Czech Republic',
        coordinator: 'Jana Svobodova',
    },
    {
        id: '3',
        name: 'CTPark Brno',
        address: 'Brno, Czech Republic',
        coordinator: 'Petr Marek',
    },
];

export const MOCK_TASKS: Task[] = [
    {
        id: '101',
        siteId: '1',
        title: 'Roof Leakage in Hall A',
        description: 'Major leak reported after heavy rain in the northwest corner.',
        status: 'TODO',
        priority: 'HIGH',
        assignee: 'Tomas Bily',
        photos: [],
        createdAt: '2026-01-08T10:00:00Z',
    },
    {
        id: '102',
        siteId: '2',
        title: 'HVAC Maintenance',
        description: 'Annual HVAC system check and filter replacement.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        assignee: 'Jan Cerny',
        photos: [],
        createdAt: '2026-01-07T09:00:00Z',
    },
    {
        id: '103',
        siteId: '1',
        title: 'Broken Gate Sensor',
        description: 'Main entrance gate sensor is not responding to RFID tags.',
        status: 'BLOCKED',
        priority: 'CRITICAL',
        assignee: 'Martin Maly',
        photos: [],
        createdAt: '2026-01-09T08:30:00Z',
    },
];
