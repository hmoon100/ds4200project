document.addEventListener('DOMContentLoaded', async function() {
    // Get DOM elements
    const container = document.getElementById('country-chart-container');
    const select = document.getElementById('country-select');

    if (!container || !select) {
        console.error('Required DOM elements not found');
        return;
    }

    // Add loading indicator
    container.innerHTML = '<div class="loading">Loading data...</div>';

    try {
        // Load data
        const response = await fetch('../python_and_data/spotify_charts_with_features_2018_complete.csv');
        const text = await response.text();

        // Parse CSV
        const data = Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;

        // Get unique regions
        const regions = [...new Set(data.map(d => d.region))].sort();

        // Populate select
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            select.appendChild(option);
        });

        // Set default to United States
        select.value = 'United States';

        function createBarChart(region) {
            // Clear container
            container.innerHTML = '';

            // Process data for selected region
            const features = ['acousticness', 'danceability', 'energy',
                            'instrumentalness', 'liveness', 'speechiness', 'valence'];

            const regionData = data.filter(d => d.region === region);
            const averages = features.map(feature => ({
                feature,
                value: d3.mean(regionData, d => d[feature])
            }));

            // Set up dimensions
            const margin = {top: 40, right: 20, bottom: 60, left: 60};
            const width = container.clientWidth - margin.left - margin.right;
            const height = container.clientHeight - margin.top - margin.bottom;

            // Create SVG
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Create scales
            const x = d3.scaleBand()
                .range([0, width])
                .domain(features)
                .padding(0.2);

            const y = d3.scaleLinear()
                .range([height, 0])
                .domain([0, 1]);

            // Add bars
            svg.selectAll('.bar')
                .data(averages)
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', d => x(d.feature))
                .attr('y', d => y(d.value))
                .attr('width', x.bandwidth())
                .attr('height', d => height - y(d.value))
                .attr('fill', 'steelblue');

            // Add axes
            svg.append('g')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll('text')
                .attr('transform', 'rotate(-45)')
                .style('text-anchor', 'end');

            svg.append('g')
                .call(d3.axisLeft(y));

            // Add title
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text(`Audio Features for ${region}`);
        }

        // Create initial chart
        createBarChart('United States');

        // Add event listener for select
        select.addEventListener('change', (e) => {
            createBarChart(e.target.value);
        });

    } catch (error) {
        console.error('Error loading or processing data:', error);
        container.innerHTML = '<div class="error">Error loading visualization</div>';
    }
});