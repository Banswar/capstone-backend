const addressFinder = async (lat, long) => {
    try {
        const url = `https://us1.locationiq.com/v1/reverse?key=${process.env.LOCATION_ACCESS_TOKEN}&lat=${lat}&lon=${long}&format=json`;
        const options = {
        method: 'GET',
        headers: { accept: 'application/json' },
        };

        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data)
        return data.display_name;
    } catch (err) {
        console.error('Error fetching address:', err);
        throw err;
    }
};

export default addressFinder;
