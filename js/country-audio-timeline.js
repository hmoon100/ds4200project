document.addEventListener('DOMContentLoaded', async function () {
    const regionSelect = document.getElementById('region-select');
    const featureSelect = document.getElementById('feature-select');
    const container = document.getElementById('timeline-chart-container');

    if (!regionSelect || !featureSelect || !container) {
        console.error('Required DOM elements not found');
        return;
    }

    // Clear existing options
    regionSelect.innerHTML = '';
    featureSelect.innerHTML = '';

    try {
        // Show loading indicator
        container.innerHTML = '<div class="loading">Loading data...</div>';

        // Fetch and parse CSV data
        const response = await fetch('../python_and_data/spotify_charts_with_features_2018_complete.csv\'');
        const text = await response.text();
        const data = Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;

        // Populate dropdowns
        const regions = [...new Set(data.map(d => d.region))].sort();
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });

        const features = [
            'popularity',
            'acousticness',
            'danceability',
            'energy',
            'instrumentalness',
            'liveness',
            'speechiness',
            'valence'
        ];
        features.forEach(feature => {
            const option = document.createElement('option');
            option.value = feature;
            option.textContent = feature.charAt(0).toUpperCase() + feature.slice(1);
            featureSelect.appendChild(option);
        });

        // Default selections
        regionSelect.value = 'United States'; // Set to United States explicitly
        featureSelect.value = 'popularity';

        // Function to create timeline plot
        function createTimelinePlot(region, feature) {
            container.innerHTML = ''; // Clear the container

            const timelineData = data
                .filter(d => d.region === region)
                .map(d => ({
                    day: d.day_of_year,
                    value: d[feature]
                }))
                .sort((a, b) => a.day - b.day);

            const groupedData = d3.rollup(
                timelineData,
                v => d3.mean(v, d => d.value),
                d => d.day
            );

            const processedData = Array.from(groupedData, ([day, value]) => ({ day, value }))
                .sort((a, b) => a.day - b.day);

            const margin = { top: 40, right: 50, bottom: 60, left: 60 };
            const width = container.clientWidth - margin.left - margin.right;
            const height = container.clientHeight - margin.top - margin.bottom;

            const svg = d3.select(container)
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            const x = d3.scaleLinear()
                .domain(d3.extent(processedData, d => d.day))
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([0, feature === 'popularity' ? 100 : 1])
                .range([height, 0]);

            const line = d3.line()
                .x(d => x(d.day))
                .y(d => y(d.value))
                .curve(d3.curveMonotoneX);

            svg.append('path')
                .datum(processedData)
                .attr('fill', 'none')
                .attr('stroke', '#3b46c2')
                .attr('stroke-width', 2)
                .attr('d', line);

            svg.selectAll('.dot')
                .data(processedData)
                .enter()
                .append('circle')
                .attr('class', 'dot')
                .attr('cx', d => x(d.day))
                .attr('cy', d => y(d.value))
                .attr('r', 3)
                .attr('fill', '#3b46c2');

            svg.append('g')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(12).tickFormat(d => {
                    const date = new Date(2018, 0, d);
                    return d3.timeFormat('%b %d')(date);
                }))
                .selectAll('text')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '.15em')
                .attr('transform', 'rotate(-45)');

            svg.append('g').call(d3.axisLeft(y));

            svg.append('text')
                .attr('x', width / 2)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text(`${feature.charAt(0).toUpperCase() + feature.slice(1)} Over Time for ${region}`);
        }

        // Initial plot
        createTimelinePlot(regionSelect.value, featureSelect.value);

        // Event listeners
        regionSelect.addEventListener('change', () => createTimelinePlot(regionSelect.value, featureSelect.value));
        featureSelect.addEventListener('change', () => createTimelinePlot(regionSelect.value, featureSelect.value));

        window.addEventListener(
            'resize',
            debounce(() => createTimelinePlot(regionSelect.value, featureSelect.value), 250)
        );
    } catch (error) {
        console.error('Error loading or processing data:', error);
        container.innerHTML = '<div class="error">Error loading data. Please try again later.</div>';
    }
});

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
