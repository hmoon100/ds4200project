// Timeline Chart for Audio Features
// Define chart dimensions and margins
const timelineMargin = { top: 40, right: 30, bottom: 60, left: 60 };
const timelineWidth = 800 - timelineMargin.left - timelineMargin.right;
const timelineHeight = 400 - timelineMargin.top - timelineMargin.bottom;

// List of audio features to analyze
const timelineFeatures = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'liveness', 'speechiness', 'valence'];

// Dynamically set the data path based on the current environment
const dataPath = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? 'js/spotify_charts_with_features_2018_complete.csv'  // path for local development
  : '/ds4200project/js/spotify_charts_with_features_2018_complete.csv';  // path for deployed site

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', async () => {
  // Create SVG container for the chart
  const svg = d3.select("#timeline-chart")
    .append("svg")
    .attr("width", timelineWidth + timelineMargin.left + timelineMargin.right)
    .attr("height", timelineHeight + timelineMargin.top + timelineMargin.bottom)
    .append("g")
    .attr("transform", `translate(${timelineMargin.left},${timelineMargin.top})`);

  try {
    // Fetch the CSV file
    const response = await fetch(dataPath);

    // Throw an error if the file can't be loaded
    if (!response.ok) throw new Error('CSV file not found');

    // Read the file content as text
    const csvText = await response.text();

    // Parse the CSV using Papa Parse library
    const parsed = Papa.parse(csvText, {
      header: true,        // Use first row as column headers
      dynamicTyping: true, // Automatically convert types (numbers, etc.)
      skipEmptyLines: true // Ignore empty lines in the CSV
    });

    // Extract the parsed data
    const data = parsed.data;

    // Get unique regions, removing any empty values
    const regions = [...new Set(data.map(d => d.region))].filter(Boolean);

    // Populate the region dropdown
    const regionSelect = d3.select("#timeline-region-select");
    regionSelect.selectAll("option")
      .data(regions)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);

    // Set default region to United States
    regionSelect.property("value", "United States");

    // Populate the feature dropdown
    const featureSelect = d3.select("#feature-select");
    featureSelect.selectAll("option")
      .data(timelineFeatures)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);

    // Set default feature to the first in the list
    featureSelect.property("value", timelineFeatures[0]);

    // Function to update the chart based on selected region and feature
    function updateChart(region, feature) {
      // Filter data for the selected region and sort by day of year
      const regionData = data.filter(d => d.region === region)
        .sort((a, b) => a.day_of_year - b.day_of_year);

      // Group data by day of year and calculate mean of the selected feature
      const groupedData = d3.rollup(
        regionData,
        v => d3.mean(v, d => d[feature]),
        d => d.day_of_year
      );

      // Convert grouped data to an array of objects
      const timelineData = Array.from(groupedData, ([day, value]) => ({
        day: day,
        value: value
      })).sort((a, b) => a.day - b.day);

      // Create x-axis scale (linear scale for days of the year)
      const x = d3.scaleLinear()
        .range([0, timelineWidth])
        .domain(d3.extent(timelineData, d => d.day));

      // Create y-axis scale (0 to 1 for feature values)
      const y = d3.scaleLinear()
        .range([timelineHeight, 0])
        .domain([0, 1]);

      // Clear any existing chart elements
      svg.selectAll("*").remove();

      // Add x-axis with month labels
      svg.append("g")
        .attr("transform", `translate(0,${timelineHeight})`)
        .call(d3.axisBottom(x).ticks(12)
          .tickFormat(d => {
            const date = new Date(2018, 0, d);
            return d3.timeFormat("%b")(date);
          }));

      // Add y-axis
      svg.append("g")
        .call(d3.axisLeft(y));

      // Create line generator
      const line = d3.line()
        .x(d => x(d.day))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

      // Draw the line
      svg.append("path")
        .datum(timelineData)
        .attr("class", "line")
        .attr("d", line);

      // Add chart title
      svg.append("text")
        .attr("x", timelineWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(`${feature} Timeline for ${region}`);

      // Add y-axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - timelineMargin.left)
        .attr("x", 0 - (timelineHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(feature);

      // Add x-axis label
      svg.append("text")
        .attr("transform", `translate(${timelineWidth/2}, ${timelineHeight + timelineMargin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Month");
    }

    // Function to handle dropdown changes
    function updateOnChange() {
      const selectedRegion = regionSelect.property("value");
      const selectedFeature = featureSelect.property("value");
      updateChart(selectedRegion, selectedFeature);
    }

    // Add event listeners to dropdowns
    regionSelect.on("change", updateOnChange);
    featureSelect.on("change", updateOnChange);

    // Initial chart render
    updateChart("United States", timelineFeatures[0]);

  } catch (error) {
    // Log any errors that occur during data loading or processing
    console.error('Error:', error);
  }
});