const features = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'liveness', 'speechiness', 'valence'];
const barMargin = { top: 40, right: 30, bottom: 60, left: 60 };
const barWidth = 800 - barMargin.left - barMargin.right;
const barHeight = 400 - barMargin.top - barMargin.bottom;

document.addEventListener('DOMContentLoaded', async () => {
    const barSvg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", barWidth + barMargin.left + barMargin.right)
        .attr("height", barHeight + barMargin.top + barMargin.bottom)
        .append("g")
        .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

    try {
        const response = await fetch('spotify_charts_with_features_2018_complete.csv');
        if (!response.ok) {
            throw new Error('Failed to load CSV file');
        }
        const csvText = await response.text();
        const parsed = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        const data = parsed.data;
        const regions = [...new Set(data.map(d => d.region))].filter(Boolean);

        // Setup region select
        const select = d3.select("#bar-region-select");
        select.selectAll("option")
            .data(regions)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);
        select.property("value", "United States");

        function updateBarChart(region) {
            const regionData = data.filter(d => d.region === region);
            const averages = features.map(feature => ({
                feature,
                value: d3.mean(regionData, d => d[feature])
            }));

            const x = d3.scaleBand()
                .range([0, barWidth])
                .padding(0.1)
                .domain(features);

            const y = d3.scaleLinear()
                .range([barHeight, 0])
                .domain([0, 1]);

            barSvg.selectAll("*").remove();

            barSvg.append("g")
                .attr("transform", `translate(0,${barHeight})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-45)");

            barSvg.append("g")
                .call(d3.axisLeft(y));

            barSvg.selectAll(".bar")
                .data(averages)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.feature))
                .attr("width", x.bandwidth())
                .attr("y", d => y(d.value))
                .attr("height", d => barHeight - y(d.value));

            barSvg.append("text")
                .attr("x", barWidth / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .text(`Audio Features for ${region}`);
        }

        // Set up event listener
        select.on("change", function() {
            updateBarChart(this.value);
        });

        // Initial render
        updateBarChart("United States");

    } catch (error) {
        console.error('Error:', error);
        // Show error message in the chart area
        barSvg.append("text")
            .attr("x", barWidth / 2)
            .attr("y", barHeight / 2)
            .attr("text-anchor", "middle")
            .text("Error loading data. Please check console for details.");
    }
});