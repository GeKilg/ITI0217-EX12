const parseDate = d3.timeParse("%Y-%m-%d"); 
d = [];

d3.dsv(";", "datasets/e19ce9f7cd6985d21742127622.csv").then(function(data) {
  data.forEach(d => {
    d.hour = +d.hour;
    d.consumption = +d.consumption;

  });
  d = data

  const uniqueDays = Array.from(new Set(data.map(d => d.date))).sort();
  const validDays = uniqueDays.filter(day => {
    const records = data.filter(d => d.date === day);
    const hoursSet = new Set(records.map(d => d.hour));
    return hoursSet.size === 24;
  });
  const last100Days = validDays.slice(-100);

  data = data.filter(d => last100Days.includes(d.date));

  const dataByDay = d3.groups(data, d => d.date);
  
  dataByDay.forEach(([day, records]) => {
    records.sort((a, b) => d3.ascending(a.hour, b.hour));
 
  });

  const svg = d3.select("#first"),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        margin = { top: 30, right: 30, bottom: 30, left: 30 };

  svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width/2)
        .attr("y", margin.top / 1.5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-family", "sans-serif")
        .text("Ühe majapidamise 100 päeva tarbimine 24 tunni lõikes (kWh)")
        .append("tspan")
        .attr("x", width/2)
        .attr("dy", "1.5em")
        .attr('class', 'small-title')
        .text("e19ce9f7cd6985d21742127622");

  const g = svg.append("g")
               .attr("transform", `translate(${width/2}, ${height/2 + 10})`)


  const innerRadius = 50,
        outerRadius = Math.min(width, height) / 2 - margin.top;


  const maxConsumption = d3.max(data, d => d.consumption);
  const rScale = d3.scaleLinear()
                   .domain([0, maxConsumption])
                   .range([innerRadius, outerRadius]);


  const angleScale = d3.scaleLinear()
                       .domain([0, 24])
                       .range([0, 2 * Math.PI]);


  const areaRadial = d3.areaRadial()
                       .angle(d => angleScale(d.hour))
                       .innerRadius(innerRadius)
                       .outerRadius(d => rScale(d.consumption))
                       .curve(d3.curveCardinalClosed);

  g.selectAll(".area")
   .data(dataByDay)
   .join("path")
     .attr("class", "area")
     .attr("d", d => areaRadial(d[1]))
     .attr("fill-opacity", 0.1);

  const radialTicks = rScale.ticks(5).slice(1);
  g.selectAll(".tick-circle")
   .data(radialTicks)
   .join("circle")
     .attr("class", "tick-circle")
     .attr("r", d => rScale(d));

  g.selectAll(".tick-label")
     .data(radialTicks)
     .join("text")
       .attr("class", "tick-label")
       .attr("x", d => rScale(d) + 5)
       .attr("y", 0)
       .attr("dominant-baseline", "middle")
       .attr("text-anchor", "start")
       .style("font-size", "10px")
       .style("fill", "#666")
       .text(d => d);

  const labelRadius = outerRadius + 10;
  g.selectAll(".hour-label")
   .data(d3.range(0, 24))
   .join("text")
     .attr("class", "hour-label")
     .attr("x", d => labelRadius * Math.cos(angleScale(d) - Math.PI/2))
     .attr("y", d => labelRadius * Math.sin(angleScale(d) - Math.PI/2))
     .attr("text-anchor", "middle")
     .attr("alignment-baseline", "middle")
     .text(d => d);

  const titleWords = ["Viimased", "100", "päeva"];
  const titleClasses = ["small-title", "large-title", "small-title"]
  const lineSpacing = [25, 25, 20];
  const offset = -(titleWords.length - 1) / 2;
  titleWords.forEach((word, i) => {
    g.append("text")
      .attr("class", "title " + titleClasses[i])
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("y", (offset + i) * lineSpacing[i])
      .text(word);
  });

});

let dayToRetrieve = "2025-01-15";
const allDatasetCodes = [
  "3fd0482ebd211dd11741080835",
  "c550bcace2429c281741504217",
  "e19ce9f7cd6985d21742127622",
  "eb18877694cc036a1742320408",
  "6f9be12993e8e64a1742388290",
  "30a9acf4c93990491742459874",
  "0c3b30cd247fe6ff1742854250",
  "c2a91e3d7222f6d51743069686",
  "41e2d9f662d6011c1743202515",
  "ed2284e75ccc65c31743346721",
  "9ded8e1571c970631743483828",
  "fe2b07c1f38b5cb91743699228",
  "51938054027b94021743707452",
  "94a4157616804ae51743754974",
]
let activeDatasets = {};
allDatasetCodes.forEach(code => activeDatasets[code] = true);

function updateChart(dayToRetrieve) {
  Promise.all(
    allDatasetCodes.map(code =>
      d3.dsv(";", `datasets/${code}.csv`).then(function(data) {
        data.forEach(d => {
          d.hour = +d.hour;
          d.consumption = +d.consumption;
        });
        const filteredData = data.filter(d => d.date === dayToRetrieve);
        return { id: code, data: filteredData };
      })
    )
  ).then(function(results) {

    const validResults = results.filter(r => r.data.length > 0);
  
    updateLegend(validResults.map(r => r.id));
    let displayResults = validResults.filter(r => activeDatasets[r.id]);
    const maxConsumption = d3.max(displayResults, r => d3.max(r.data, d => d.consumption)) || 0;

    const parseTime = d3.timeParse("%Y-%m-%d");
    const formatTime = d3.timeFormat("%d.%m.%Y");
    let dateObj = parseTime(dayToRetrieve);
    let formatted = formatTime(dateObj);

    const rScale = d3.scaleLinear()
      .domain([0, maxConsumption])
      .range([innerRadius, outerRadius]);

    radialArea.outerRadius(d => rScale(d.consumption));

    const ticks = rScale.ticks(5).slice(1);
    g.selectAll(".tick-circle")
      .data(ticks)
      .join("circle")
        .attr("class", "tick-circle")
        .attr("r", d => rScale(d))
        .attr("fill", "none")
        .attr("stroke", "#ccc")
      .transition().duration(1000)
        .attr("r", d => rScale(d));
    
    g.selectAll(".tick-label")
      .data(ticks)
      .join("text")
        .attr("class", "tick-label")
        .attr("x", d => rScale(d))
        .attr("y", 0)
        .attr("dy", "-0.3em")
        .attr("text-anchor", "middle")
        .style("fill", "#666")
        .style("font-size", "10px")
        .text(d => d);

    displayResults.forEach(result => {
      let path = g.selectAll(`.radial-path-${result.id}`)
                    .data([result.data]);

      path.enter().append("path")
          .attr("class", `radial-path-${result.id}`)
          .attr("fill", colorScale(result.id))
          .attr("stroke", colorScale(result.id))
          .attr("stroke-width", 1)
          .attr("fill-opacity", 0.2)
          .attr("d", radialArea)
        .merge(path)
          .transition().duration(1000)
          .attr("d", radialArea);
    });

    allDatasetCodes.forEach(code => {
      if (!activeDatasets[code] || validResults.findIndex(r => r.id === code) === -1) {
         g.selectAll(`.radial-path-${code}`).remove();
      }
    });

    g.select(".center-label")
      .transition().duration(1000)
      .text(formatted);
  });
}


function updateLegend(validIDs) {

  const legendContainer = d3.select("#legend");
  legendContainer.selectAll("*").remove();
  
  const legendItems = legendContainer.selectAll(".legend-item")
                            .data(validIDs)
                            .enter()
                            .append("div")
                            .attr("class", "legend-item")
                            .style("display", "flex")
                            .style("align-items", "center")
                            .style("margin", "4px");
  
  legendItems.append("input")
             .attr("type", "checkbox")
             .attr("id", d => "cb-" + d)
             .property("checked", d => activeDatasets[d])
             .on("change", function(event, d) {
                activeDatasets[d] = this.checked;
                updateChart(dayToRetrieve);
             });
  
  legendItems.append("span")
             .text(d => d)
             .style("margin-left", "4px")
             .style("cursor", "pointer")
             .style("color", d => colorScale(d))
             .on("mouseover", function(event, d) {
                g.selectAll(`.radial-path-${d}`)
                  .transition().duration(200)
                  .attr("stroke-width", 3)
                  .attr("fill-opacity", 0.5);
             })
             .on("mouseout", function(event, d) {
                g.selectAll(`.radial-path-${d}`)
                  .transition().duration(200)
                  .attr("stroke-width", 1)
                  .attr("fill-opacity", 0.2);
             });
}


const svg = d3.select("#second"),
      width = +svg.attr("width"),
      height = +svg.attr("height"), 
      margin = { top: 30, right: 30, bottom: 30, left: 30 };

svg.selectAll("*").remove();

svg.append("text")
  .attr("class", "chart-title")
  .attr("x", width / 2)
  .attr("y", margin.top / 1.5)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .style("font-family", "sans-serif")
  .text("Erinevate majapidamiste ühe päeva tarbimine (kWh)")
  .append("tspan")
        .attr("x", width / 2)
        .attr("dy", "1.5em")
        .attr("class", "small-title")
        .text("Kuupäeva saab muuta ringi keskel");

const g = svg.append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2 + 10})`);

const innerRadius = 60;
const outerRadius = Math.min(width, height) / 2 - Math.max(margin.top, margin.right);

const angleScale = d3.scaleLinear()
  .domain([0, 24])
  .range([0, 2 * Math.PI]);

const radialArea = d3.areaRadial()
  .angle(d => angleScale(d.hour))
  .innerRadius(innerRadius)
  .outerRadius(d => d.consumption)
  .curve(d3.curveCatmullRomClosed);

const colors = allDatasetCodes.map((d, i) => d3.interpolateRainbow(i / allDatasetCodes.length));
const colorScale = d3.scaleOrdinal()
  .domain(allDatasetCodes)
  .range(d3.schemeSet2);

const labelRadius = outerRadius + 10;
g.selectAll(".hour-label")
  .data(d3.range(0, 24))
  .enter().append("text")
    .attr("class", "hour-label")
    .attr("x", d => labelRadius * Math.cos(angleScale(d) - Math.PI / 2))
    .attr("y", d => labelRadius * Math.sin(angleScale(d) - Math.PI / 2))
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("font-size", "10px")
    .text(d => d);

g.selectAll(".center-label").remove();

g.append("text")
  .attr("class", "center-label")
  .attr("text-anchor", "middle")
  .attr("alignment-baseline", "middle")
  .attr("dy", "0")
  .attr("z-index", "1")
  .attr("fill", "#6b89a1")
  .style("font-size", "14px")
  .text("");

g.append("foreignObject")
  .attr("class", "center-fo")
  .attr("x", -40)
  .attr("y", -15)
  .attr("width", 80)
  .attr("height", 30)
  .append("xhtml:input")
    .attr("type", "date")
    .attr("value", dayToRetrieve)
    .style("width", "100%")
    .style("font-size", "14px")
    .on("change", function() {
      dayToRetrieve = this.value;
      updateChart(dayToRetrieve);
    });

updateChart(dayToRetrieve);