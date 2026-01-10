export interface Site {
    id: number;
    name: string;
    address: string;
    level?: string;
    facility_manager: number | null;
    property_manager: number | null;
    latitude: number;
    longitude: number;
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
        id: 1,
        name: 'CTPark Prague North',
        address: 'Prague North, Czech Republic',
        facility_manager: 101,
        property_manager: 102,
        latitude: 50.0755,
        longitude: 14.4378
    },
    {
        id: 2,
        name: 'CTPark Ostrava',
        address: 'Ostrava, Czech Republic',
        facility_manager: 103,
        property_manager: null,
        latitude: 49.8209,
        longitude: 18.2625
    },
    {
        id: 3,
        name: 'CTPark Brno',
        address: 'Brno, Czech Republic',
        facility_manager: null,
        property_manager: 102,
        latitude: 49.1951,
        longitude: 16.6068
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
