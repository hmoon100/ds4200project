const timelineFeatures = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'liveness', 'speechiness', 'valence'];
const timelineMargin = { top: 40, right: 30, bottom: 60, left: 60 };
const timelineWidth = 800 - timelineMargin.left - timelineMargin.right;
const timelineHeight = 400 - timelineMargin.top - timelineMargin.bottom;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Timeline Chart');

    // Log the current path to understand the environment
    console.log('Current pathname:', window.location.pathname);
    console.log('Current URL:', window.location.href);

    const timelineSvg = d3.select("#timeline-chart")
        .append("svg")
        .attr("width", timelineWidth + timelineMargin.left + timelineMargin.right)
        .attr("height", timelineHeight + timelineMargin.top + timelineMargin.bottom)
        .append("g")
        .attr("transform", `translate(${timelineMargin.left},${timelineMargin.top})`);

    console.log('Timeline SVG container created');

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

        // Rest of the code with additional logging...
        // ... (previous code remains the same but with logging) ...

    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            type: error.name
        });
        timelineSvg.append("text")
            .attr("x", timelineWidth / 2)
            .attr("y", timelineHeight / 2)
            .attr("text-anchor", "middle")
            .text("Error loading data. Please check console for details.");
    }
});