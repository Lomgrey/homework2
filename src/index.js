import "babel-polyfill";
import Chart from "chart.js";

const currencyURL = "www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const meteoURL = "xml.meteoservice.ru/export/gismeteo/point/140.xml";

async function loadCurrency() {
  const response = await fetch(currencyURL);
  const xmlTest = await response.text();
  const parser = new DOMParser();
  const currencyData = parser.parseFromString(xmlTest, "text/xml");
  // <Cube currency="USD" rate="1.1321" />
  const rates = currencyData.querySelectorAll("Cube[currency][rate]");
  const result = Object.create(null);
  for (let i = 0; i < rates.length; i++) {
    const rateTag = rates.item(i);
    const rate = rateTag.getAttribute("rate");
    const currency = rateTag.getAttribute("currency");
    result[currency] = rate;
  }
  result["EUR"] = 1;
  // result["RANDOM"] = 1 + Math.random();
  return result;
}

function normalizeDataByCurrency(data, currency) {
  const result = Object.create(null);
  const value = data[currency];
  for (const key of Object.keys(data)) {
    result[key] = value / data[key];
  }
  return result;
}

async function loadMeteoCurrency() {
  const response = await fetch(meteoURL);
  const xmlData = await response.text();

  const parser = new DOMParser();
  const currencyData = parser.parseFromString(xmlData, "application/xml");

  const forecasts = currencyData.querySelectorAll(
    "FORECAST[day][month][hour]"
  );
  const temperatures = currencyData.querySelectorAll(
    "TEMPERATURE[max][min]"
  );

  const result = Object.create(null);
  for (let i = 0; i < forecasts.length; i++) {
    const f = forecasts.item(i);
    const t = temperatures.item(i);
    
    const day = f.getAttribute("day");
    const month = f.getAttribute("month");
    const hour = f.getAttribute("hour");
    const date = hour + "h. " + day + "." + month;

    const max = t.getAttribute("max");
    const min = t.getAttribute("min");
    
    result[date] = {max, min};
  }

  return result;
}

const buttonBuild = document.getElementById("btn");
const canvasCtx = document.getElementById("out").getContext("2d");
buttonBuild.addEventListener("click", async function() {
  const meteoData = await loadMeteoCurrency();
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
  
  if (window.chart) {
    chart.data.labels = chartConfig.data.labels;
    chart.data.datasets[0].data = chartConfig.data.datasets[0].data;
    chart.update({
      duration: 800,
      easing: "easeOutBounce"
    });
  } else {
    window.chart = new Chart(canvasCtx, chartConfig);
  }
});