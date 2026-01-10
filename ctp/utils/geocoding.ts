export async function getAddressFromCoordinates(latitude: number, longitude: number): Promise<string | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CTPapp/1.0', // Nominatim requires a User-Agent
                },
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();

        // Construct a nice address string
        if (data.address) {
            const { road, house_number, suburb, city, town, village } = data.address;
            const street = road ? `${road} ${house_number || ''}` : '';
            const locality = city || town || village || suburb || '';

            return [street, locality].filter(Boolean).join(', ') || data.display_name;
        }

        return data.display_name;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}
