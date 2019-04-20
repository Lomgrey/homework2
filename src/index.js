import "babel-polyfill";
import Chart from "chart.js";

// const currencyURL = "www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const meteoURL = "xml.meteoservice.ru/export/gismeteo/point/140.xml";

async function loadMeteo() {
  const parser = new DOMParser();

  const xmlData = await fetch(meteoURL).then(r => r.text());
  const meteoData = parser.parseFromString(xmlData, "application/xml");

  const forecasts = meteoData.querySelectorAll("FORECAST");
  const result = Object.create(null);
  for (let i = 0; i < forecasts.length; i++) {
    const forecast = forecasts.item(i);
    const temperature = forecast.querySelector("TEMPERATURE[max][min]");

    const date = dateOfForecast(forecast);
    const max = temperature.getAttribute("max");
    const min = temperature.getAttribute("min");
    
    result[date] = {max, min};
  }

  return result;
}

function dateOfForecast(forecast){
  const day = forecast.getAttribute("day");
  const month = forecast.getAttribute("month");
  const hour = forecast.getAttribute("hour");

  return hour + "h. " + day + "." + month;
}

const buttonBuild = document.getElementById("btn");
const canvasCtx = document.getElementById("out").getContext("2d");
buttonBuild.addEventListener("click", async function() {
  const meteoData = await loadMeteo();
  const keys = Object.keys(meteoData);

  const maxValues = keys.map(key => meteoData[key].max);
  const minValues = keys.map(key => meteoData[key].min);
  const chartConfig = {
    type: "line",

    data: {
      labels: keys,
      datasets: [
        {
          label: "Минимальная температура",
          backgroundColor: "rgb(180, 180, 255)",
          borderColor: "rgb(150, 150, 255)",
          data: minValues
        },
        {
          label: "Максимальная температура",
          backgroundColor: "rgb(255, 20, 20)",
          borderColor: "rgb(180, 0, 0)",
          data: maxValues
        }
      ]
    }
  };
  
  updateChart(chartConfig);
});

function updateChart(chartConfig){
  if (window.chart) {
    updateLabels(chartConfig.data.labels);
    updateDatasetrs(chartConfig.data.datasets);
    chart.update({
      duration: 800,
      easing: "easeOutQuad"
    });
  } else {
    window.chart = new Chart(canvasCtx, chartConfig);
  }
}

function updateLabels(labels){
  chart.data.labels = labels;
}

function updateDatasetrs(datasets) {
  chart.data.datasets = datasets
}