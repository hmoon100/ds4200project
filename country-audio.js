const features = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'liveness', 'speechiness', 'valence'];
const barMargin = { top: 40, right: 30, bottom: 60, left: 60 };
const barWidth = 800 - barMargin.left - barMargin.right;
const barHeight = 400 - barMargin.top - barMargin.bottom;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Bar Chart');

    // Log the current path to understand the environment
    console.log('Current pathname:', window.location.pathname);
    console.log('Current URL:', window.location.href);

    const barSvg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", barWidth + barMargin.left + barMargin.right)
        .attr("height", barHeight + barMargin.top + barMargin.bottom)
        .append("g")
        .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

    console.log('SVG container created');

    try {
        // Updated fetch URL for GitHub Pages with logging
        const csvPath = window.location.pathname.includes('github.io')
            ? '/ds4200project/spotify_charts_with_features_2018_complete.csv'
            : 'spotify_charts_with_features_2018_complete.csv';

        console.log('Attempting to fetch CSV from path:', csvPath);

        const response = await fetch(csvPath);
        console.log('Fetch response status:', response.status);

        if (!response.ok) {
            throw new Error(`Failed to load CSV file. Status: ${response.status}`);
        }

        const csvText = await response.text();
        console.log('CSV text length:', csvText.length);
        console.log('First 100 characters of CSV:', csvText.substring(0, 100));

        const parsed = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        console.log('Papa Parse results:', {
            rows: parsed.data.length,
            fields: parsed.meta.fields,
            errors: parsed.errors
        });

        const data = parsed.data;
        const regions = [...new Set(data.map(d => d.region))].filter(Boolean);
        console.log('Unique regions found:', regions);

        // Setup region select
        const select = d3.select("#bar-region-select");
        console.log('Region select element found:', select.node() !== null);

        select.selectAll("option")
            .data(regions)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);
        select.property("value", "United States");

        console.log('Region select options populated');

        function updateBarChart(region) {
            console.log('Updating bar chart for region:', region);
            const regionData = data.filter(d => d.region === region);
            console.log('Filtered data points for region:', regionData.length);

            const averages = features.map(feature => ({
                feature,
                value: d3.mean(regionData, d => d[feature])
            }));
            console.log('Calculated averages:', averages);

            // Rest of the updateBarChart function remains the same...
            // ... (previous charting code) ...
        }

        // Set up event listener
        select.on("change", function() {
            console.log('Region selection changed to:', this.value);
            updateBarChart(this.value);
        });

        // Initial render
        console.log('Performing initial render for United States');
        updateBarChart("United States");

    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            type: error.name
        });
        barSvg.append("text")
            .attr("x", barWidth / 2)
            .attr("y", barHeight / 2)
            .attr("text-anchor", "middle")
            .text("Error loading data. Please check console for details.");
    }
});
