// Timeline Chart for Audio Features
const timelineMargin = { top: 40, right: 30, bottom: 60, left: 60 };
const timelineWidth = 800 - timelineMargin.left - timelineMargin.right;
const timelineHeight = 400 - timelineMargin.top - timelineMargin.bottom;
const timelineFeatures = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'liveness', 'speechiness', 'valence'];

document.addEventListener('DOMContentLoaded', async () => {
  const svg = d3.select("#timeline-chart")
    .append("svg")
    .attr("width", timelineWidth + timelineMargin.left + timelineMargin.right)
    .attr("height", timelineHeight + timelineMargin.top + timelineMargin.bottom)
    .append("g")
    .attr("transform", `translate(${timelineMargin.left},${timelineMargin.top})`);

  try {
    const response = await fetch('spotify_charts_with_features_2018_complete.csv');
    if (!response.ok) throw new Error('CSV file not found');
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    const data = parsed.data;
    const regions = [...new Set(data.map(d => d.region))].filter(Boolean);

    const regionSelect = d3.select("#timeline-region-select");
    regionSelect.selectAll("option")
      .data(regions)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);

    regionSelect.property("value", "United States");

    const featureSelect = d3.select("#feature-select");
    featureSelect.selectAll("option")
      .data(timelineFeatures)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);

    featureSelect.property("value", timelineFeatures[0]);

    function updateChart(region, feature) {
      const regionData = data.filter(d => d.region === region)
        .sort((a, b) => a.day_of_year - b.day_of_year);

      const groupedData = d3.rollup(
        regionData,
        v => d3.mean(v, d => d[feature]),
        d => d.day_of_year
      );

      const timelineData = Array.from(groupedData, ([day, value]) => ({
        day: day,
        value: value
      })).sort((a, b) => a.day - b.day);

      const x = d3.scaleLinear()
        .range([0, timelineWidth])
        .domain(d3.extent(timelineData, d => d.day));

      const y = d3.scaleLinear()
        .range([timelineHeight, 0])
        .domain([0, 1]);

      svg.selectAll("*").remove();

      svg.append("g")
        .attr("transform", `translate(0,${timelineHeight})`)
        .call(d3.axisBottom(x).ticks(12)
          .tickFormat(d => {
            const date = new Date(2018, 0, d);
            return d3.timeFormat("%b")(date);
          }));

      svg.append("g")
        .call(d3.axisLeft(y));

      const line = d3.line()
        .x(d => x(d.day))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

      svg.append("path")
        .datum(timelineData)
        .attr("class", "line")
        .attr("d", line);

      svg.append("text")
        .attr("x", timelineWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(`${feature} Timeline for ${region}`);

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - timelineMargin.left)
        .attr("x", 0 - (timelineHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(feature);

      svg.append("text")
        .attr("transform", `translate(${timelineWidth/2}, ${timelineHeight + timelineMargin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Month");
    }

    function updateOnChange() {
      const selectedRegion = regionSelect.property("value");
      const selectedFeature = featureSelect.property("value");
      updateChart(selectedRegion, selectedFeature);
    }

    regionSelect.on("change", updateOnChange);
    featureSelect.on("change", updateOnChange);

    updateChart("United States", timelineFeatures[0]);
  } catch (error) {
    console.error('Error:', error);
  }
});